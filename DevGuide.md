# SpaceFinder Developer Guide

This Developer Guide provides instructions on setting up the project pre-requisites manually in your developer environment.

Please make sure to go through the [Quickstart guide](Quickstart.md) first to familiarize yourself with the application and codebase. The [Quickstart Guide](Quickstart.md) walks through setting up a demo environment (5 minutes) with a tutorial of key app flows (30 minutes). This lab is self-contained and cleans up after itself by un-deploying all auto-generated AWS resources.


## Backend API

Spacefinder uses a Serverless API built using Amazon API Gateway, Lambda, DynamoDB, and CloudFormation. The API has the following REST methods, and some methods can only be called by users with "Admin" privileges.

![Spacefinder API]

For full visibility into how everything works, you're able to setup the backend API in a fully automated way in your personal AWS account, which will then allow you to tweak settings and better understand the key interactions.

### Installing the prerequisites

The framework relies on [Node.js] and [npm].

    # install the latest Gulp CLI tools globally (you will need a newer version of Gulp CLI which supports Gulp v4)
    npm install gulpjs/gulp-cli -g

    # Checkout the git repo
    git clone https://github.com/awslabs/aws-serverless-auth-reference-app.git
    
    # install the Node modules for the bootstrapping process 
    cd aws-serverless-auth-reference-app/api
    npm install
    
    # install the Node modules for the Lambda run-time
    cd ./lambda
    npm install
    
    # Optional: Update the API config file if you'd like to use a specific non-default AWS profile or different region than us-east-1 to install to.
    # vi aws-serverless-auth-reference-app/api/config.js

    # Run the API automated bootstrapping process to deploy all AWS resources to your account
    # gulp commands need to be run from 'api' directory
    cd ..
    gulp deploy
    
    # Bootstrap your application with Sample data
    gulp bootstrap


## Mobile app

The mobile app is a hybrid mobile app, and is built on the [Ionic2 framework], which relies on [Angular 2] and [TypeScript 2.0]. The hybrid mobile app can run on Android devices and iOS devices, as well as a modern web browser.



### Installing the prerequisites

The application framework relies on [Node.js] and [npm]. It also uses [Apache Cordova] plugins to support certain native functionality on mobile devices.

    # install Ionic2 CLI, Cordova, and Bower tools
    npm install -g ionic@2.2.1 cordova@6.5.0 bower
    
    # install the Node modules 
    cd aws-serverless-auth-reference-app/app
    npm install

    # install Cordova platform components if you would like to build the app for mobile
    cordova platform remove android
    cordova platform remove ios
    cordova platform add android@5.X.X
    cordova platform add ios@4.X.X
    
### Running the app

As a hybrid mobile app, SpaceFinder can run in web browser, on Android devices, and on Apple iOS devices.

#### Run in a web browser

This useful for development purposes. If prompted for address/port to bind to, choose 'localhost'

    ionic serve

#### Run in an Android device or emulator
    
You can run the app in an actual Android mobile device, or in an Android emulator. The following command generates
an Android APK file, and run it in an Android emulator. Note that this requires previous installation of the Android SDK and existence of the ANDROID_HOME environmental variable.

    ionic run android

Alternatively, to generate just the Android APK file, which can then be loaded onto an Android device:

    ionic build android

Remote debug live content on an Android device from your Windows, Mac, or Linux computer,
using [Chrome's remote debugger tool], and visiting `chrome://inspect` in your Chrome browser.
There are also third-party tools such as [Vysor] which can allow you to view your mobile device screen on your computer.

#### Run in an Apple iOS emulator

    ionic run ios
    
 ----
    
### Using the app

#### Sample users and data

Sample users and location/resource data are created as part of the bootstrapping process, to make it easy for you to try out the user flows. Use the following users to login to the application. You may additionally create your own personal accounts.

* Standard user
  * Username: `user1`
  * Password: `Test123!`
  * Can browse resources, make bookings, and upload profile picture

* Admin user
  * Username: `admin1`
  * Password: `Test123!`
  * Can additionally create and delete locations and resources

#### Console logging

Enable the browser developer console (or remote debugging for Android) to view all of the log messages.

The log messages will show you all tokens retrieved as part of the sign-in process, as well as all API calls made and the corresponding authorization for each call.

-----

### Uninstallation

When you're through testing and using the application, you may run the following command to delete any previously created backend resources that are hosted in your AWS account.

    cd aws-serverless-auth-reference-app/api
    gulp undeploy

[AWS Cognito]:https://aws.amazon.com/cognito/
[AWS Lambda]:https://aws.amazon.com/lambda/ 
[Amazon DynamoDB]:https://aws.amazon.com/dynamodb/
[Amazon API Gateway]:https://aws.amazon.com/api-gateway/
[AWS CloudFormation]:https://aws.amazon.com/cloudformation/
[Vysor]:https://www.vysor.io/
[Chrome's remote debugger tool]:https://developers.google.com/web/tools/chrome-devtools/remote-debugging/
[Node.js]:https://nodejs.org/en/download/
[npm]:https://www.npmjs.com/
[Apache Cordova]:https://cordova.apache.org/
[Spacefinder Mobile app]:/app/docs/images/screenshot-small.png?raw=true
[Spacefinder API]:/api/docs/images/spacefinder-api.png?raw=true
[Spacefinder Mobile App architecture]:/app/docs/images/spacefinder-app-architecture.png?raw=true
[Ionic2 framework]:http://ionicframework.com/docs/v2/
[Angular 2]:https://angular.io/
[TypeScript 2.0]:https://www.typescriptlang.org/index.html
[AWS re:Invent 2016: Serverless Authentication and Authorization: Identity Management for Serverless Architectures (MBL306)]:https://www.youtube.com/watch?v=n4hsWVXCuVI&list=PLhr1KZpdzukdAg4bXtTfICuFeZFC_H2Xq&index=6
[AWS re:Invent 2016]: https://reinvent.awsevents.com/
[User Groups]:http://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-user-groups.html
