'use strict';
var rfr = require('rfr');
var logger = rfr('util/logger');
var config = rfr('config');
var AWS = config.AWS;
var cf = rfr('/util/cloudFormation');
let identityPools = new AWS.CognitoIdentity();
let userPools = new AWS.CognitoIdentityServiceProvider();

let identityPoolName = config.getName('identityPool').replace(/-/g, '_');
let userPoolName = config.getName('userPool');
let userPoolClientName = userPoolName + '-client';
let newUserTempPassword = 'Temp123!';

function createUserPool() {
  let params = {
    PoolName: userPoolName,
    AutoVerifiedAttributes: [
      'email'
    ]
  };
  return new Promise((resolve, reject) => {
    userPools.createUserPool(params, function (err, data) {
      if (err) {
        if (err.code === 'ResourceConflictException') {
          resolve('User pool already exists');
          return;
        } else {
          reject(err);
          return;
        }
      }
      logger.info('Created Cognito User Pool', params.PoolName);
      resolve(data);
    });
  }).then(createUserPoolClientsV2);
}

function safeCreateUserPool() {
  let listUserPoolsParams = {
    MaxResults: 60
  };
  return new Promise((resolve, reject) => {
    userPools.listUserPools(listUserPoolsParams, function (err, data) {
      if (err) {
        reject(err);
      }
      for (let i = 0; i < data.UserPools.length; i++) {
        // Check if existing user pool matches desired user pool name
        if (data.UserPools[i].Name === config.getName('userPool')) {
          // Name match found. Return and resolve
          logger.info('User pool already exists');
          resolve('User pool already exists');
          return;
        }
      }

      // No name match found. Create new user pool
      resolve(createUserPool());
    });
  });
}

function createUserPoolClient(params) {
  return new Promise((resolve, reject) => {
    userPools.createUserPoolClient(params, function (err, data) {
      if (err) {
        if (err.code === 'ResourceConflictException') {
          resolve('User pool client ' + params.ClientName + ' already exists');
          return;
        } else {
          reject(err);
          return;
        }
      }
      logger.info('Created Cognito User Pool Client', params.ClientName);
      resolve(data);
    });
  });
}

function createUserPoolClientsV2(data) {
  return new Promise((resolve, reject) => {
    let userPoolId = data.UserPool.Id;

    let appConfigParameters = {
      ClientName: userPoolClientName,
      UserPoolId: userPoolId,
      ExplicitAuthFlows: [
        'ADMIN_NO_SRP_AUTH'
      ],
      GenerateSecret: false,
      ReadAttributes: [
        'address',
        'birthdate',
        'email',
        'email_verified',
        'family_name',
        'gender',
        'given_name',
        'locale',
        'middle_name',
        'name',
        'nickname',
        'phone_number',
        'phone_number_verified',
        'picture',
        'preferred_username',
        'profile',
        'zoneinfo',
        'updated_at',
        'website'
      ],
      WriteAttributes: [
        'address',
        'birthdate',
        'email',
        'family_name',
        'gender',
        'given_name',
        'locale',
        'middle_name',
        'name',
        'nickname',
        'phone_number',
        'picture',
        'preferred_username',
        'profile',
        'zoneinfo',
        'updated_at',
        'website'
      ]
    };

    createUserPoolClient(appConfigParameters).then(() => {
      // Create admin client after app client successfully created
      resolve('Created user pool LEX client successfully');
    }).catch((err) => {
      reject(err);
    });
  });
}


function getUserPoolId() {
  let listUserPoolsParams = {
    MaxResults: 60
  };
  return new Promise((resolve, reject) => {
    userPools.listUserPools(listUserPoolsParams, function (err, data) {
      if (err) {
        reject(err);
        return;
      }
      for (let i = 0; i < data.UserPools.length; i++) {
        // Loop through user pools to find desired user pool and return Id
        if (data.UserPools[i].Name === userPoolName) {
          resolve(data.UserPools[i].Id);
        }
      }
    });
  });
}

function getUserPoolClientId(userPoolClientName, userPoolId) {
  let listUserPoolClientsParams = {
    MaxResults: 60,
    UserPoolId: userPoolId
  };
  return new Promise((resolve, reject) => {
    userPools.listUserPoolClients(listUserPoolClientsParams, function (err, data) {
      if (err) {
        reject(err);
        return;
      }
      for (let i = 0; i < data.UserPoolClients.length; i++) {
        // Loop through user pools to find desired user pool and return Id
        if (data.UserPoolClients[i].ClientName === userPoolClientName) {
          resolve(data.UserPoolClients[i].ClientId);
        }
      }
    });
  });
}


function createIdentityPoolV2() {
  return new Promise((resolve, reject) => {
    getUserPoolId().then((userPoolId) => {
      let listUserPoolClientParams = {
        UserPoolId: userPoolId,
        MaxResults: 60
      };
      userPools.listUserPoolClients(listUserPoolClientParams, function (err, data) {
        if (err) {
          reject(err);
          return;
        }
        let userPoolClientIds = [];
        for (let i = 0; i < data.UserPoolClients.length; i++) {
          // Loop through user pool clients to find desired user pool client and return Id
          if (data.UserPoolClients[i].ClientName === userPoolClientName) {
            userPoolClientIds.push(data.UserPoolClients[i].ClientId);
          }
        }
        if (userPoolClientIds.length !== 0) {
          resolve(createIdentityPoolImpl(userPoolId, userPoolClientIds));
        } else {
          // Reject promise if no match is found
          reject(new Error('No user pool client was defined in user pool'));
        }
      });
    });
  });
}


function createIdentityPoolImpl(userPoolId, userPoolClientIds) {
  let cognitoIdentityProviders = [];
  for (var i = 0; i < userPoolClientIds.length; i++) {
    let provider = {
      ClientId: userPoolClientIds[i],
      ProviderName: 'cognito-idp.' + config.AWS_REGION + '.amazonaws.com/' + userPoolId
    };
    cognitoIdentityProviders.push(provider);
  }
  let params = {
    AllowUnauthenticatedIdentities: false,
    IdentityPoolName: identityPoolName,
    CognitoIdentityProviders: cognitoIdentityProviders
  };
  return new Promise((resolve, reject) => {
    identityPools.createIdentityPool(params, function (err) {
      if (err) {
        if (err.code === 'ResourceConflictException') {
          resolve('Identity pool already exists');
          return;
        } else {
          reject(err);
          return;
        }
      }
      logger.info('Created Cognito Identity Pool', params.IdentityPoolName);
      resolve(setIdentityPoolRoles());
    });
  });
}

function safeCreateIdentityPool() {
  let listIdentityPoolsParams = {
    MaxResults: 60
  };
  return new Promise((resolve, reject) => {
    identityPools.listIdentityPools(listIdentityPoolsParams, function (err, data) {
      if (err) {
        reject(err);
        return;
      }
      for (let i = 0; i < data.IdentityPools.length; i++) {
        // Check if existing user pool matches desired user pool name
        if (data.IdentityPools[i].IdentityPoolName === identityPoolName) {
          // Name match found. Return and resolve
          logger.info('Identity pool already exists');
          resolve('Identity pool already exists');
          return;
        }
      }

      // No name match found. Create new user pool
      resolve(createIdentityPoolV2());
    });
  });
}

function getIdentityPoolId() {
  let listIdentityPoolsParams = {
    MaxResults: 60
  };
  return new Promise((resolve, reject) => {
    identityPools.listIdentityPools(listIdentityPoolsParams, function (err, data) {
      if (err) {
        reject(err);
        return;
      }
      for (let i = 0; i < data.IdentityPools.length; i++) {
        // Loop through user pools to find desired user pool and return Id
        if (data.IdentityPools[i].IdentityPoolName === identityPoolName) {
          resolve(data.IdentityPools[i].IdentityPoolId);
          break;
        }
      }
      reject(new Error('No matching identity pool ID found'));
    });
  });
}

function setIdentityPoolRoles() {
  return cf.getStackOutputs().then((cfOutputs) => {
    let cognitoAuthRoleArn = cfOutputs.CognitoIdentityPoolAuthRoleArn;
    let cognitoUnAuthRoleArn = cfOutputs.CognitoIdentityPoolUnAuthRoleArn;
    return getIdentityPoolId().then((identityPoolId) => {
      let params = {
        IdentityPoolId: identityPoolId,
        Roles: {
          authenticated: cognitoAuthRoleArn,
          unauthenticated: cognitoUnAuthRoleArn
        }
      };
      return new Promise((resolve, reject) => {
        identityPools.setIdentityPoolRoles(params, function (err) {
          if (err) {
            reject(err);
            return;
          }
          logger.info('Setup Cognito Identity Pools user roles');
          resolve('Setup Cognito Identity Pools user roles');
        });
      });
    });
  });
}

function deleteIdentityPool() {
  return getIdentityPoolId().then((identityPoolId) => {
    let params = {
      IdentityPoolId: identityPoolId
    };
    identityPools.deleteIdentityPool(params, function (err, data) {
      if (err) {
        throw (new Error(err));
      }
      return (data);
    });
  });
}

function deleteUserPool() {
  return getUserPoolId().then((userPoolId) => {
    let params = {
      UserPoolId: userPoolId
    };
    userPools.deleteUserPool(params, function (err, data) {
      if (err) {
        throw (new Error(err));
      }
      return (data);
    });
  });
}

function adminCreateGroup(group) {
  return getUserPoolId().then((userPoolId) => {

    let params = {
      UserPoolId: userPoolId,
      GroupName: group.name,
      Description: group.description,
      Precedence: group.precedence
    };
    userPools.createGroup(params, function (err, data) {
      if (err) {
        throw (new Error(err));
      }
      return (data)
    });
  });

}


function adminAssignUserToGroup(user, group) {
  return getUserPoolId().then((userPoolId) => {
    let params = {
      UserPoolId: userPoolId,
      Username: user.username,
      GroupName: group.name
    };

    userPools.adminAddUserToGroup(params, function (err, data) {
      if (err) {
        throw (new Error(err));
      }
      return (data)
    })
  });
}


function adminCreateUser(userData) {
  return getUserPoolId().then((userPoolId) => {
    let createUserParams = {
      UserPoolId: userPoolId,
      Username: userData.username,
      MessageAction: 'SUPPRESS',
      TemporaryPassword: newUserTempPassword,
      UserAttributes: [
        {
          Name: 'email',
          Value: userData.email
        },
        {
          Name: 'given_name',
          Value: userData.givenName
        },
        {
          Name: 'family_name',
          Value: userData.familyName
        }
      ]
    };
    userPools.adminCreateUser(createUserParams, function (err) {
      if (err) {
        throw (new Error(err));
      }
      return initialChangePassword(userData);
    });
  });
}

function initialChangePassword(userData) {
  return new Promise((resolve, reject) => {
    getUserPoolId().then((userPoolId) => {
      getUserPoolClientId(userPoolClientName, userPoolId).then((userPoolClientId) => {
        let adminInitiateAuthParams = {
          AuthFlow: 'ADMIN_NO_SRP_AUTH',
          ClientId: userPoolClientId,
          UserPoolId: userPoolId,
          AuthParameters: {
            USERNAME: userData.username,
            PASSWORD: newUserTempPassword
          }
        };
        userPools.adminInitiateAuth(adminInitiateAuthParams, function (err, data) {
          if (err) {
            logger.error(err);
            reject(err);
          }
          let adminChallengeResponse = {
            ChallengeName: 'NEW_PASSWORD_REQUIRED',
            ClientId: userPoolClientId,
            UserPoolId: userPoolId,
            ChallengeResponses: {
              USERNAME: userData.username,
              NEW_PASSWORD: userData.password
            },
            Session: data.Session
          };
          userPools.adminRespondToAuthChallenge(adminChallengeResponse, function (err, data) {
            if (err) {
              logger.error(err);
              reject(err);
            }
            resolve(data);
          });
        });
      });
    })
  });
}

function getIdentityPoolUserId(userData) {
  return new Promise((resolve, reject) => {
    getUserPoolId().then((userPoolId) => {
      getUserPoolClientId(userPoolClientName, userPoolId).then((userPoolClientId) => {
        let adminInitiateAuthParams = {
          AuthFlow: 'ADMIN_NO_SRP_AUTH',
          ClientId: userPoolClientId,
          UserPoolId: userPoolId,
          AuthParameters: {
            USERNAME: userData.username,
            PASSWORD: userData.password
          }
        };
        userPools.adminInitiateAuth(adminInitiateAuthParams, function (err, data) {
          if (err) {
            logger.error(err);
            reject(err);
          }
          let cognitoIdToken = data.AuthenticationResult.IdToken;
          getIdentityPoolId().then((identityPoolId) => {
            let cognitoIdpKey = 'cognito-idp.' + config.AWS_REGION + '.amazonaws.com/' + userPoolId;
            let getIdParams = {
              IdentityPoolId: identityPoolId,
              Logins: {}
            };
            getIdParams.Logins[cognitoIdpKey] = cognitoIdToken;
            logger.info('getIdParams', getIdParams);
            identityPools.getId(getIdParams, function (err, data) {
              if (err) {
                logger.error(err);
                reject(err);
              }
              logger.info('GetID Success', data);
              resolve(data);
            });
          });
        });
      });
    })
  })
}

function createCognitoPools() {
  return safeCreateUserPool().then(safeCreateIdentityPool);
}

function deleteCognitoPools() {
  return deleteIdentityPool().then(deleteUserPool);
}


module.exports = {
  adminCreateUser,
  createCognitoPools,
  deleteCognitoPools,
  getIdentityPoolId,
  getIdentityPoolUserId,
  getUserPoolId,
  getUserPoolClientId,
  adminCreateGroup,
  adminAssignUserToGroup,
  userPoolClientName
};
