'use strict';
var rfr = require('rfr');
var logger = rfr('util/logger');
var config = rfr('config');
var cf = rfr('/util/cloudFormation');
var apig = rfr('/util/apigateway');
var cognito = rfr('/util/cognito');
var path = require('path');
var fs = require('fs');

let appGeneratedConfigFile = path.join(__dirname,'..','..','app','src','config','config-overrides-generated.ts');
let lambdaEnvironmentConfigFile = path.join(__dirname,'..','lambda','environment.js');

function generateClientConfig() {
  let generatedConfig = {};
  generatedConfig.REGION = config.AWS_REGION;
  return cf.getStackOutputs().then((cfOutputs) => {
    generatedConfig.PROFILE_IMAGES_S3_BUCKET = cfOutputs.UserDataBucket;
  }).then(() => {
    return apig.getApiInvokeUrl().then((apiInvokeUrl) => {
      generatedConfig.API_ENDPOINT = apiInvokeUrl;
      return cognito.getUserPoolId().then((userPoolId) => {
        generatedConfig.USER_POOL_ID = userPoolId;
        return cognito.getUserPoolClientId(cognito.userPoolClientName, generatedConfig.USER_POOL_ID).then((userPoolClientId) => {
          generatedConfig.CLIENT_ID = userPoolClientId;
          return cognito.getIdentityPoolId().then((identityPoolId) => {
            generatedConfig.IDENTITY_POOL_ID = identityPoolId;
            logger.info('Generated Config:\n', generatedConfig);

            // Generate Lambda config environment file for User Pools token verification
            let lambdaEnvironmentConfig = "'use strict';\n// Auto-generated file, do not modify directly\n\nvar config = " +
              JSON.stringify(generatedConfig, null, 2) + ';\n\nmodule.exports = { config };';
            fs.writeFileSync(lambdaEnvironmentConfigFile, lambdaEnvironmentConfig);
            logger.info('Successfully generated Lambda environment config');

            // Generate mobile/client app configuration file to point to deployed API
            let configOverridesFile = '// Auto-generated file, do not modify directly\n\nconst configOverridesGenerated = ' +
              JSON.stringify(generatedConfig, null, 2) + ';\n\nexport { configOverridesGenerated }';
            fs.writeFileSync(appGeneratedConfigFile, configOverridesFile);
            logger.info('Successfully generated application config');
          })
        })
      })
    })
  })
}

module.exports = {
  generateClientConfig
};
