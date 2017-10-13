import { configOverridesGenerated } from './config-overrides-generated'
// DO NOT DELETE THIS FILE!!!

//==============================================
// Default configurations
//==============================================

const Config = {

  USER_POOL_ID:               'us-east-1_XWrI9RV17',
  USER_POOL_DOMAIN_NAME:      'spacefinder-dev-us-east-1-opikzdefz.auth.us-east-1.amazoncognito.com',
  USER_POOL_DOMAIN_PREFIX:    'spacefinder-dev-us-east-1-opikzdefz',
  CLIENT_ID:                  '3dtdumg0i1jrvv23lorfmrlk3l',
  IDENTITY_POOL_ID:           'us-east-1:992b6d88-74c2-4d5a-9dcd-25e37fa0ff45',
  REGION:                     'us-east-1',  // Your AWS region where you setup your Cognito User Pool and Federated Identities

  PROFILE_IMAGES_S3_BUCKET:   'spacefinder-api-development-stack-userdatabucket-14zwhc5glptvt',

  API_ENDPOINT:               'https://6jmlncvx8c.execute-api.us-east-1.amazonaws.com/development',

  DEVELOPER_MODE:             false, // enable to automatically login
  CODE_VERSION:               '1.0.0',
  DEFAULT_USERNAMES:          ['user1', 'admin1'] // default users cannot change their passwords

};

//==============================================



// Merge in the values from the auto-generated config.
// If there are are conflicts, then the values from the
// auto-generated config will override
function mergeConfigurations() {
  for (let attributeName of Object.keys(configOverridesGenerated)) {
    Config[attributeName] = configOverridesGenerated[attributeName];
  }
}

mergeConfigurations();

export { Config }
