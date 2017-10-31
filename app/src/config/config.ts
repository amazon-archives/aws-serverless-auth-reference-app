import { configOverridesGenerated } from './config-overrides-generated'
// DO NOT DELETE THIS FILE!!!

//==============================================
// Default configurations
//==============================================

const Config = {

  USER_POOL_ID:               'us-east-1_79D6i69td',
  USER_POOL_DOMAIN_NAME:      'spacefinder-development-us-east-1-79d6i69td.auth.us-east-1.amazoncognito.com',
  USER_POOL_DOMAIN_PREFIX:    'spacefinder-development-us-east-1-79d6i69td',
  CLIENT_ID:                  '58pvvcoktlrhcng34ve68i74uf',
  IDENTITY_POOL_ID:           'us-east-1:aac5e9e6-ff3a-4586-b984-2cd88b693f69',
  REGION:                     'us-east-1',  // Your AWS region where you setup your Cognito User Pool and Federated Identities

  PROFILE_IMAGES_S3_BUCKET:   'spacefinder-development-stack-userdatabucket-11wtuhxdpzbp5',

  API_ENDPOINT:               'https://g2drvofsu8.execute-api.us-east-1.amazonaws.com/development',

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
