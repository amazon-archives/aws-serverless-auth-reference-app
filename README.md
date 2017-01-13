# SpaceFinder - Serverless Auth Reference App

**SpaceFinder** is a reference mobile app that allows users to book conference rooms, work desks, and other shared resources. The app showcases **serverless authentication and authorization** using the AWS platform.

The mobile front-end is built using the [Ionic2 framework] and client libraries to call AWS services and mobile backend APIs. The backend APIs themselves are powered by AWS services. The backend APIs are built using a serverless architecture, which makes it easy to deploy updates, and it also means that there are no servers to operationally manage.

SpaceFinder is primarily developed and maintained by Jim Tran and Justin Pirtle, Solutions Architects at Amazon Web Services. The project code is released under the Apache 2.0 license. Please feel free to make use of the code in this project, and spread the word. We hope you enjoy it, and we certainly welcome all feedback, pull requests and other contributions!

## Video presentation

A live demo of the SpaceFinder app was presented at [AWS re:Invent 2016], the annual AWS cloud computing conference. The presentation provides useful context on the authentication and authorization flows that the app demonstrates. The YouTube recording of the session (53 minutes) is available here:

* [AWS re:Invent 2016: Serverless Authentication and Authorization: Identity Management for Serverless Architectures (MBL306)]
<br/>Presenters: Jim Tran and Justin Pirtle
<br/>Presented on: November 30, 2016


## Architecture diagram

![Spacefinder Mobile App architecture]

## AWS services used

SpaceFinder is built using the following AWS services:

* [AWS Cognito] - Amazon Cognito lets you easily add user sign-up and sign-in to your mobile and web apps. With Amazon Cognito, you also have the options to authenticate users through social identity providers such as Facebook, Twitter, or Amazon, with SAML identity solutions, or by using your own identity system. Furthermore, [AWS Cognito] supports [User Groups] that let to create collections of users to manage their permissions or to represent different types of users.   
* [AWS Lambda] - AWS Lambda lets you run code without provisioning or managing servers. You pay only for the compute time you consume - there is no charge when your code is not running. With Lambda, you can run code for virtually any type of application or backend service - all with zero administration.
* [Amazon DynamoDB] - Amazon DynamoDB is a fast and flexible NoSQL database service for all applications that need consistent, single-digit millisecond latency at any scale. It is a fully managed cloud database and supports both document and key-value store models.
* [Amazon API Gateway] - Amazon API Gateway is a fully managed service that makes it easy for developers to create, publish, maintain, monitor, and secure APIs at any scale. You can create an API that acts as a “front door” for applications to access data, business logic, or functionality from your back-end services, such as workloads running on Amazon Elastic Compute Cloud (Amazon EC2), code running on AWS Lambda, or any Web application. Amazon API Gateway handles all the tasks involved in accepting and processing up to hundreds of thousands of concurrent API calls, including traffic management, authorization and access control, monitoring, and API version management.
* [AWS CloudFormation] - AWS CloudFormation gives developers and systems administrators an easy way to create and manage a collection of related AWS resources, provisioning and updating them in an orderly and predictable fashion.

----

## Backend API

Spacefinder uses a Serverless API built using Amazon API Gateway, Lambda, DynamoDB, and CloudFormation. The API has the following REST methods, and some methods can only be called by users with "Admin" privileges.

![Spacefinder API]

If you only want to quickly run the mobile app to try out the app and see how it leverages different authorization patterns, you do not need to deploy the backend API to your account.

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

----

## Mobile app

The mobile app is a hybrid mobile app, and is built on the [Ionic2 framework], which relies on [Angular 2] and [TypeScript 2.0]. The hybrid mobile app can run on Android devices and iOS devices, as well as a modern web browser.

![Spacefinder Mobile app]

## User flows

The app currently demonstrates the following user flows:

* Identity Management
  * Register as a new user
  * Confirm registration code
  * Sign in (as a user who has already confirmed a registration code)
  * Sign in (as a user who has not yet confirmed a registration code)
  * Re-send registration code
  * Forgot password
  * Change password
  * Sign-out
* SpaceFinder Application Features
  * View list of locations
  * Add a new location (Admin-only feature)
  * Delete a location  (Admin-only feature)
  * View list of resources at a location
  * Add a new resource (Admin-only feature)
  * Delete a resource (Admin-only feature)
  * View resource availability
  * Book a new booking
  * Cancel own booking
  * Cancel another user's booking (Admin-only feature)
  * Upload a profile image to Amazon S3
  * Toggle display of admin-only features

### Installing the prerequisites

The application framework relies on [Node.js] and [npm]. It also uses [Apache Cordova] plugins to support certain native functionality on mobile devices.

    # install latest version of the Ionic2 CLI, Cordova, and Bower tools
    npm install -g ionic cordova bower
    
    # install the Node modules 
    cd aws-serverless-auth-reference-app/app
    npm install
    
    # install the Bower crypto components (for AWS request signing)
    bower install

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

[AWS Cognito]:(https://aws.amazon.com/cognito/)
[AWS Lambda]:(https://aws.amazon.com/lambda/) 
[Amazon DynamoDB]:(https://aws.amazon.com/dynamodb/) 
[Amazon API Gateway]:(https://aws.amazon.com/api-gateway/)
[AWS CloudFormation]:(https://aws.amazon.com/cloudformation/)
[Vysor]:(https://www.vysor.io/)
[Chrome's remote debugger tool]:(https://developers.google.com/web/tools/chrome-devtools/remote-debugging/)
[Node.js]:(https://nodejs.org/en/download/)
[npm]:(https://www.npmjs.com/)
[Apache Cordova]:(https://cordova.apache.org/)
[Spacefinder Mobile app]:(/app/docs/images/screenshot-small.png?raw=true)
[Spacefinder API]:(/api/docs/images/spacefinder-api.png?raw=true)
[Spacefinder Mobile App architecture]:(/app/docs/images/spacefinder-app-architecture.png?raw=true)
[Ionic2 framework]:(http://ionicframework.com/docs/v2/)
[Angular 2]:(https://angular.io/)
[TypeScript 2.0]:(https://www.typescriptlang.org/index.html)
[AWS re:Invent 2016: Serverless Authentication and Authorization: Identity Management for Serverless Architectures (MBL306)]:(https://www.youtube.com/watch?v=n4hsWVXCuVI&list=PLhr1KZpdzukdAg4bXtTfICuFeZFC_H2Xq&index=6)
[AWS re:Invent 2016]:(https://reinvent.awsevents.com/)
[User Groups]:(http://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-user-groups.html)
