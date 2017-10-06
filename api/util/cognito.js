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
let userPoolAdminClientName = userPoolName + '-admin-client';
let userPoolAppClientName = userPoolName + '-app-client';
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
  }).then(createUserPoolClients);
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

function createUserPoolClients(data) {
  return new Promise((resolve, reject) => {
    let userPoolId = data.UserPool.Id;

    let adminClientParams = {
      ClientName: userPoolAdminClientName,
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
      RefreshTokenValidity: 1,
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

    let appClientParams = {
      ClientName: userPoolAppClientName,
      UserPoolId: userPoolId,
      AllowedOAuthFlows: [
        'code',
        'implicit'
      ],
      AllowedOAuthFlowsUserPoolClient: true,
      AllowedOAuthScopes: [
        'email',
        'openid',
        'profile'
      ],
      CallbackURLs: [
        'https://aws.amazon.com'
      ],
      DefaultRedirectURI: 'https://aws.amazon.com',
      GenerateSecret: false,
      LogoutURLs: [
        'https://aws.amazon.com'
      ],
      ReadAttributes: [
        'email',
        'email_verified',
        'family_name',
        'given_name',
        'name',
        'preferred_username',
        'updated_at',
      ],
      RefreshTokenValidity: 30,
      SupportedIdentityProviders: [
        'COGNITO'
      ]
    };

    createUserPoolClient(appClientParams).then(() => {
      // Create admin client after app client successfully created
      createUserPoolClient(adminClientParams).then(() => {
        resolve(createUserPoolDomain(userPoolId));
      }).catch((err) => {
        reject(err);
      });
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
      let found = false;
      for (let i = 0; i < data.UserPools.length; i++) {
        // Loop through user pools to find desired user pool and return Id
        if (data.UserPools[i].Name === userPoolName) {
          resolve(data.UserPools[i].Id);
          found = true;
        }
      }
      if (!found) {
        reject(new Error(`Could not find userPool ${userPoolName}`));
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
      let found = false;
      for (let i = 0; i < data.UserPoolClients.length; i++) {
        // Loop through user pools to find desired user pool and return Id
        if (data.UserPoolClients[i].ClientName === userPoolClientName) {
          resolve(data.UserPoolClients[i].ClientId);
          found = true;
        }
      }
      if (!found) {
        reject(new Error(`Could not find userPool ${userPoolClientName}`));
      }
    });
  });
}

function createIdentityPool() {
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
          if (data.UserPoolClients[i].ClientName === userPoolAppClientName || data.UserPoolClients[i].ClientName === userPoolAdminClientName) {
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
      resolve(setIdentityPoolRoles(userPoolId, userPoolClientIds));
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
      resolve(createIdentityPool());
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

function setIdentityPoolRoles(userPoolId, userPoolClientIds) {
  return cf.getStackOutputs().then((cfOutputs) => {
    let cognitoAuthStandardRoleArn = cfOutputs.CognitoIdentityPoolAuthStandardRoleArn;
    let cognitoUnAuthRoleArn = cfOutputs.CognitoIdentityPoolUnAuthRoleArn;
    return getIdentityPoolId().then((identityPoolId) => {
      let userPoolRoleMappings = {};
      for (let i = 0; i < userPoolClientIds.length; i++) {
        userPoolRoleMappings['cognito-idp.' + config.AWS_REGION + '.amazonaws.com/' + userPoolId + ':' + userPoolClientIds[i]] = {
          Type: 'Token',
          AmbiguousRoleResolution: 'Deny'
        };
      }
      let params = {
        IdentityPoolId: identityPoolId,
        Roles: {
          authenticated: cognitoAuthStandardRoleArn,
          unauthenticated: cognitoUnAuthRoleArn
        },
        RoleMappings: userPoolRoleMappings
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
    return deleteUserPoolDomain(userPoolId).then(() => {
      userPools.deleteUserPool(params, function (err, data) {
        if (err) {
          throw (new Error(err));
        }
        return (data);
      });
    });
  });
}

/**
 * The function creates a Cognito UserGroup based on the input argument.
 * If the group already exists, then it ignores the request.
 * @param group The group we want to create
 * @returns {Promise.<TResult>|*}
 */
function adminCreateGroup(group) {
  return getUserPoolId().then((userPoolId) => {
    return cf.getStackOutputs().then((cfOutputs) => {
      let roleArns = {};
      roleArns.cognitoAuthAdminRoleArn = cfOutputs.CognitoIdentityPoolAuthAdminRoleArn;
      roleArns.cognitoAuthStandardRoleArn = cfOutputs.CognitoIdentityPoolAuthStandardRoleArn;
      roleArns.cognitoUnAuthRoleArn = cfOutputs.CognitoIdentityPoolUnAuthRoleArn;

      logger.info('Incoming request to crate group %s', group.name);
      let listParams = {
        UserPoolId: userPoolId
      };

      let params = {
        UserPoolId: userPoolId,
        GroupName: group.name,
        Description: group.description,
        Precedence: group.precedence,
        RoleArn: roleArns[group.roleArn]
      };
      userPools.listGroups(listParams, function (err, listData) {
        if (err) {
          throw (new Error(err));
        }
        for (let userGroupIndex in listData.Groups) {

          if (listData.Groups[userGroupIndex].GroupName === group.name) {
            logger.info('Group %s already exists, ignoring', group.name);
            return;
          }
        }
        userPools.createGroup(params, function (err, data) {
          if (err) {
            throw (new Error(err));
          }
          return (data);
        })
      });
    });
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
    let listUserParams = {
      UserPoolId: userPoolId
    };
    userPools.listUsers(listUserParams, function (err, listUsersData) {
      if (err) {
        throw (new Error(err));
      }
      for (let poolUserIndex in listUsersData.Users) {
        if (listUsersData.Users[poolUserIndex].Username === userData.username) {
          logger.info('User %s already exists, ignoring', userData.username);
          return;
        }
      }
      userPools.adminCreateUser(createUserParams, function (err) {
        if (err) {
          throw (new Error(err));
        }
        return initialChangePassword(userData);
      });
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
      return (data);
    })
  });
}

function initialChangePassword(userData) {
  return new Promise((resolve, reject) => {
    getUserPoolId().then((userPoolId) => {
      getUserPoolClientId(userPoolAdminClientName, userPoolId).then((userPoolClientId) => {
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
      getUserPoolClientId(userPoolAdminClientName, userPoolId).then((userPoolClientId) => {
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

function createUserPoolDomain(userPoolId) {
  return getUserPoolDomainPrefix().then((userPoolDomain) => {
    let params = {
      Domain: userPoolDomain,
      UserPoolId: userPoolId
    };
    return new Promise((resolve, reject) => {
      userPools.createUserPoolDomain(params, function (err) {
        if (err) {
          reject(err);
          return;
        }
        logger.info('Created Cognito User Pool Domain', params.Domain);
        resolve('Created user pool successfully');
      });
    });
  });  
}

function getUserPoolDomainPrefix() {
  return getUserPoolId().then((userPoolId) => {
    // Convert user pool ID string suffix to lower case letters, numbers, and hypens only (replacing underscore character)
    return config.getName(userPoolId).toLowerCase().replace('_','-');
  });
}

function getUserPoolDomainName() {
  return getUserPoolDomainPrefix().then((userPoolDomainPrefix) => {
    return userPoolDomainPrefix + '.auth.' + config.AWS_REGION + '.amazoncognito.com';
  });  
}

function deleteUserPoolDomain(userPoolId) {
  return getUserPoolDomainPrefix().then((userPoolDomain) => {
    let params = {
      Domain: userPoolDomain,
      UserPoolId: userPoolId
    };
    return new Promise((resolve, reject) => {
      userPools.deleteUserPoolDomain(params, function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve('Deleted Cognito User Pool Domain', params.Domain);
      });
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

function createCognitoPools() {
  return safeCreateUserPool().then(safeCreateIdentityPool());
}

function deleteCognitoPools() {
  return deleteIdentityPool().then(deleteUserPool());
}

module.exports = {
  adminAssignUserToGroup,
  adminCreateUser,
  adminCreateGroup,
  createCognitoPools,
  deleteCognitoPools,
  getIdentityPoolId,
  getIdentityPoolUserId,
  getUserPoolId,
  getUserPoolClientId,
  getUserPoolDomainName,
  getUserPoolDomainPrefix,
  userPoolAppClientName
};
