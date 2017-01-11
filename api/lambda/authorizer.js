'use strict';
var rfr = require('rfr');
var logger = rfr('/logger');
var config = rfr('/config');
var jwt = require('jsonwebtoken');
var env = rfr('/environment');
var request = require('request');
var jwkToPem = require('jwk-to-pem');
var PEMS = null;
console.log('Loading function');

/**
 * AuthPolicy receives a set of allowed and denied methods and generates a valid
 * AWS policy for the API Gateway authorizer. The constructor receives the calling
 * user principal, the AWS account ID of the API owner, and an apiOptions object.
 * The apiOptions can contain an API Gateway RestApi Id, a region for the RestApi, and a
 * stage that calls should be allowed/denied for. For example
 * {
 *   restApiId: 'xxxxxxxxxx,
 *   region: 'us-east-1,
 *   stage: 'dev',
 * }
 *
 * const testPolicy = new AuthPolicy("[principal user identifier]", "[AWS account id]", apiOptions);
 * testPolicy.allowMethod(AuthPolicy.HttpVerb.GET, "/users/username");
 * testPolicy.denyMethod(AuthPolicy.HttpVerb.POST, "/pets");
 * callback(null, testPolicy.build());
 *
 * @class AuthPolicy
 * @constructor
 */
function AuthPolicy(principal, awsAccountId, apiOptions) {
  /**
   * The AWS account id the policy will be generated for. This is used to create
   * the method ARNs.
   *
   * @property awsAccountId
   * @type {String}
   */
  this.awsAccountId = awsAccountId;

  /**
   * The principal used for the policy, this should be a unique identifier for
   * the end user.
   *
   * @property principalId
   * @type {String}
   */
  this.principalId = principal;

  /**
   * The policy version used for the evaluation. This should always be "2012-10-17"
   *
   * @property version
   * @type {String}
   * @default "2012-10-17"
   */
  this.version = '2012-10-17';

  /**
   * The regular expression used to validate resource paths for the policy
   *
   * @property pathRegex
   * @type {RegExp}
   * @default '^\/[/.a-zA-Z0-9-\*]+$'
   */
  this.pathRegex = new RegExp('^[/.a-zA-Z0-9-\*]+$');

  // These are the internal lists of allowed and denied methods. These are lists
  // of objects and each object has two properties: a resource ARN and a nullable
  // conditions statement. The build method processes these lists and generates
  // the appropriate statements for the final policy.
  this.allowMethods = [];
  this.denyMethods = [];

  if (!apiOptions || !apiOptions.restApiId) {
    this.restApiId = '*';
  } else {
    this.restApiId = apiOptions.restApiId;
  }
  if (!apiOptions || !apiOptions.region) {
    this.region = '*';
  } else {
    this.region = apiOptions.region;
  }
  if (!apiOptions || !apiOptions.stage) {
    this.stage = '*';
  } else {
    this.stage = apiOptions.stage;
  }
}

/**
 * A set of existing HTTP verbs supported by API Gateway. This property is here
 * only to avoid spelling mistakes in the policy.
 *
 * @property HttpVerb
 * @type {Object}
 */
AuthPolicy.HttpVerb = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
  ALL: '*',
};

AuthPolicy.prototype = (function AuthPolicyClass() {
  /**
   * Adds a method to the internal lists of allowed or denied methods. Each object in
   * the internal list contains a resource ARN and a condition statement. The condition
   * statement can be null.
   *
   * @method addMethod
   * @param {String} The effect for the policy. This can only be "Allow" or "Deny".
   * @param {String} The HTTP verb for the method, this should ideally come from the
   *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
   * @param {String} The resource path. For example "/pets"
   * @param {Object} The conditions object in the format specified by the AWS docs.
   * @return {void}
   */
  function addMethod(effect, verb, resource, conditions) {
    if (verb !== '*' && !Object.prototype.hasOwnProperty.call(AuthPolicy.HttpVerb, verb)) {
      throw new Error(`Invalid HTTP verb ${verb}. Allowed verbs in AuthPolicy.HttpVerb`);
    }

    if (!this.pathRegex.test(resource)) {
      throw new Error(`Invalid resource path: ${resource}. Path should match ${this.pathRegex}`);
    }

    let cleanedResource = resource;
    if (resource.substring(0, 1) === '/') {
      cleanedResource = resource.substring(1, resource.length);
    }
    const resourceArn = `arn:aws:execute-api:${this.region}:${this.awsAccountId}:${this.restApiId}/${this.stage}/${verb}/${cleanedResource}`;

    if (effect.toLowerCase() === 'allow') {
      this.allowMethods.push({
        resourceArn,
        conditions,
      });
    } else if (effect.toLowerCase() === 'deny') {
      this.denyMethods.push({
        resourceArn,
        conditions,
      });
    }
  }

  /**
   * Returns an empty statement object prepopulated with the correct action and the
   * desired effect.
   *
   * @method getEmptyStatement
   * @param {String} The effect of the statement, this can be "Allow" or "Deny"
   * @return {Object} An empty statement object with the Action, Effect, and Resource
   *                  properties prepopulated.
   */
  function getEmptyStatement(effect) {
    const statement = {};
    statement.Action = 'execute-api:Invoke';
    statement.Effect = effect.substring(0, 1).toUpperCase() + effect.substring(1, effect.length).toLowerCase();
    statement.Resource = [];

    return statement;
  }

  /**
   * This function loops over an array of objects containing a resourceArn and
   * conditions statement and generates the array of statements for the policy.
   *
   * @method getStatementsForEffect
   * @param {String} The desired effect. This can be "Allow" or "Deny"
   * @param {Array} An array of method objects containing the ARN of the resource
   *                and the conditions for the policy
   * @return {Array} an array of formatted statements for the policy.
   */
  function getStatementsForEffect(effect, methods) {
    const statements = [];

    if (methods.length > 0) {
      const statement = getEmptyStatement(effect);

      for (let i = 0; i < methods.length; i++) {
        const curMethod = methods[i];
        if (curMethod.conditions === null || curMethod.conditions.length === 0) {
          statement.Resource.push(curMethod.resourceArn);
        } else {
          const conditionalStatement = getEmptyStatement(effect);
          conditionalStatement.Resource.push(curMethod.resourceArn);
          conditionalStatement.Condition = curMethod.conditions;
          statements.push(conditionalStatement);
        }
      }

      if (statement.Resource !== null && statement.Resource.length > 0) {
        statements.push(statement);
      }
    }

    return statements;
  }


  return {
    constructor: AuthPolicy,

    /**
     * Adds an allow "*" statement to the policy.
     *
     * @method allowAllMethods
     */
    allowAllMethods() {
      addMethod.call(this, 'allow', '*', '*', null);
    },

    /**
     * Adds a deny "*" statement to the policy.
     *
     * @method denyAllMethods
     */
    denyAllMethods() {
      addMethod.call(this, 'deny', '*', '*', null);
    },

    /**
     * Adds an API Gateway method (Http verb + Resource path) to the list of allowed
     * methods for the policy
     *
     * @method allowMethod
     * @param {String} The HTTP verb for the method, this should ideally come from the
     *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
     * @param {string} The resource path. For example "/pets"
     * @return {void}
     */
    allowMethod(verb, resource) {
      addMethod.call(this, 'allow', verb, resource, null);
    },

    /**
     * Adds an API Gateway method (Http verb + Resource path) to the list of denied
     * methods for the policy
     *
     * @method denyMethod
     * @param {String} The HTTP verb for the method, this should ideally come from the
     *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
     * @param {string} The resource path. For example "/pets"
     * @return {void}
     */
    denyMethod(verb, resource) {
      addMethod.call(this, 'deny', verb, resource, null);
    },

    /**
     * Adds an API Gateway method (Http verb + Resource path) to the list of allowed
     * methods and includes a condition for the policy statement. More on AWS policy
     * conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition
     *
     * @method allowMethodWithConditions
     * @param {String} The HTTP verb for the method, this should ideally come from the
     *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
     * @param {string} The resource path. For example "/pets"
     * @param {Object} The conditions object in the format specified by the AWS docs
     * @return {void}
     */
    allowMethodWithConditions(verb, resource, conditions) {
      addMethod.call(this, 'allow', verb, resource, conditions);
    },

    /**
     * Adds an API Gateway method (Http verb + Resource path) to the list of denied
     * methods and includes a condition for the policy statement. More on AWS policy
     * conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition
     *
     * @method denyMethodWithConditions
     * @param {String} The HTTP verb for the method, this should ideally come from the
     *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
     * @param {string} The resource path. For example "/pets"
     * @param {Object} The conditions object in the format specified by the AWS docs
     * @return {void}
     */
    denyMethodWithConditions(verb, resource, conditions) {
      addMethod.call(this, 'deny', verb, resource, conditions);
    },


    /**
     * Generates the policy document based on the internal lists of allowed and denied
     * conditions. This will generate a policy with two main statements for the effect:
     * one statement for Allow and one statement for Deny.
     * Methods that includes conditions will have their own statement in the policy.
     *
     * @method build
     * @return {Object} The policy object that can be serialized to JSON.
     */
    build() {
      if ((!this.allowMethods || this.allowMethods.length === 0) &&
        (!this.denyMethods || this.denyMethods.length === 0)) {
        throw new Error('No statements defined for the policy');
      }

      const policy = {};
      policy.principalId = this.principalId;
      const doc = {};
      doc.Version = this.version;
      doc.Statement = [];

      doc.Statement = doc.Statement.concat(getStatementsForEffect.call(this, 'Allow', this.allowMethods));
      doc.Statement = doc.Statement.concat(getStatementsForEffect.call(this, 'Deny', this.denyMethods));

      policy.policyDocument = doc;

      return policy;
    },
  };
}());


function processAuthRequest(event, tokenIssuer, callback) {

  const apiOptions = {};
  const tmp = event.methodArn.split(':');
  const apiGatewayArnTmp = tmp[5].split('/');
  const awsAccountId = tmp[4];

  apiOptions.region = tmp[3];
  apiOptions.restApiId = apiGatewayArnTmp[0];
  apiOptions.stage = apiGatewayArnTmp[1];






  var token = event.authorizationToken;

  //Fail if the token is not jwt
  var decodedJwt = jwt.decode(token, {complete: true});
  if (!decodedJwt) {
    let policy = new AuthPolicy('', awsAccountId, apiOptions);
    logger.info("Not valid JWT token, returning deny all policy");
    policy.denyAllMethods();
    let iamPolicy = policy.build();
    callback(null, iamPolicy);
    return;
  }

  //Fail if token is not from your User Pool
  if (decodedJwt.payload['iss'] != tokenIssuer) {
    logger.info("Provided Token not from UserPool, returning deny all policy");
    let policy = new AuthPolicy('', awsAccountId, apiOptions);
    policy.denyAllMethods();
    let iamPolicy = policy.build();
    callback(null, iamPolicy);
    return;
  }

  //Reject the jwt if it's not an 'Identity Token'
  if (decodedJwt.payload['token_use'] != 'id') {
    console.log("Not an Identity token");
    logger.info("Provided Token is not and identity token, returning deny all policy");
    let policy = new AuthPolicy('', awsAccountId, apiOptions);
    policy.denyAllMethods();
    let iamPolicy = policy.build();
    callback(null, iamPolicy);
    return;
  }

  //Get the kid from the token and retrieve corresponding PEM
  var kid = decodedJwt.header.kid;
  var pem = PEMS[kid];
  if (!pem) {
    console.log('Invalid Identity token');
    logger.info("Invalid Identity token, returning deny all policy");
    let policy = new AuthPolicy('', awsAccountId, apiOptions);
    policy.denyAllMethods();
    let iamPolicy = policy.build();
    callback(null, iamPolicy);
    return;
  }

  //Verify the signature of the JWT token to ensure it's really coming from your User Pool

  jwt.verify(token, pem, {issuer: tokenIssuer}, function (err, payload) {
    if (err) {
      logger.info("Error while trying to verify the Token, returning deny-all policy");
      let policy = new AuthPolicy('', awsAccountId, apiOptions);
      policy.denyAllMethods();
      let iamPolicy = policy.build();
      callback(null, iamPolicy);
    } else {
      //Valid token. Generate the API Gateway policy for the user
      //Always generate the policy on value of 'sub' claim and not for
      // 'username' because username is reassignable
      //sub is UUID for a user which is never reassigned to another user.

      let admin = null;
      const pId = payload.sub;
      logger.info(pId);
      let policy = new AuthPolicy(pId, awsAccountId, apiOptions);
      policy.allowAllMethods();

      //Check the Cognito group entry for Admin.
      //Assuming here that the Admin group has always higher
      //precedence
      const principalId = payload.sub;

      if (payload['cognito:groups'] &&
        payload['cognito:groups'][0] === 'adminGroup') {
        admin = true;
      }

      if (!admin) {
        policy.denyMethod(AuthPolicy.HttpVerb.DELETE, '/locations');
        policy.denyMethod(AuthPolicy.HttpVerb.DELETE, '/locations/*');
        policy.denyMethod(AuthPolicy.HttpVerb.POST, '/locations');
        policy.denyMethod(AuthPolicy.HttpVerb.POST, '/locations/*');
      }

      let iamPolicy = policy.build();
      logger.info('Generated IAM Policy', iamPolicy);
      logger.info('Effective IAM statement', iamPolicy.policyDocument.Statement);
      callback(null, iamPolicy);
    }
  });
}

function toPem(keyDictionary) {

  var modulus = keyDictionary.n;
  var exponent = keyDictionary.e;
  var key_type = keyDictionary.kty;
  var jwk = {kty: key_type, n: modulus, e: exponent};
  var pem = jwkToPem(jwk);
  return pem;
}

exports.Custom = (event, context, callback) => {

  let userPoolURI = 'https://cognito-idp.' + config.AWS_REGION
    + '.amazonaws.com/' + env.config.USER_POOL_ID;

  let jwtKeySetURI = userPoolURI + '/.well-known/jwks.json';


  if (!PEMS) {
    request({url: jwtKeySetURI, json: true},
      function (error, response, body) {
        if (!error && response.statusCode === 200) {
          PEMS = {};
          var keys = body['keys'];
          for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
            var kid = keys[keyIndex].kid;
            PEMS[kid] = toPem(keys[keyIndex]);
          }
          processAuthRequest(event, userPoolURI, callback);

        } else {
          callback('Unauthorized');
        }
      }
    );
  } else {
    processAuthRequest(event, userPoolURI, callback);
  }

};
