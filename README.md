# SpaceFinder - Serverless Auth Reference App

**SpaceFinder** is a reference mobile app that allows users to book conference rooms, work desks, and other shared resources. The app showcases **serverless authentication and authorization** using the AWS platform.

The mobile front-end is built using the [Ionic2 framework](http://ionicframework.com/docs/v2/) and client libraries to call AWS services and mobile backend APIs. The backend APIs themselves are powered by AWS services. The backend APIs are built using a serverless architecture, which makes it easy to deploy updates, and it also means that there are no servers to operationally manage.

SpaceFinder is primarily developed and maintained by Jim Tran and Justin Pirtle, Solutions Architects at Amazon Web Services. The project code is released under the Apache 2.0 license. Please feel free to make use of the code in this project, and spread the word. We hope you enjoy it, and we certainly welcome all feedback, pull requests and other contributions!

## Architecture diagram

![Spacefinder Mobile App architecture](/app/docs/images/spacefinder-app-architecture.png?raw=true)

## AWS services used

SpaceFinder is built using the following AWS services:

* [AWS Cognito](https://aws.amazon.com/cognito/) - Amazon Cognito lets you easily add user sign-up and sign-in to your mobile and web apps. With Amazon Cognito, you also have the options to authenticate users through social identity providers such as Facebook, Twitter, or Amazon, with SAML identity solutions, or by using your own identity system.
* [AWS Lambda](https://aws.amazon.com/lambda/) - AWS Lambda lets you run code without provisioning or managing servers. You pay only for the compute time you consume - there is no charge when your code is not running. With Lambda, you can run code for virtually any type of application or backend service - all with zero administration.
* [Amazon DynamoDB](https://aws.amazon.com/dynamodb/) - Amazon DynamoDB is a fast and flexible NoSQL database service for all applications that need consistent, single-digit millisecond latency at any scale. It is a fully managed cloud database and supports both document and key-value store models.
* [Amazon API Gateway](https://aws.amazon.com/api-gateway/) - Amazon API Gateway is a fully managed service that makes it easy for developers to create, publish, maintain, monitor, and secure APIs at any scale. You can create an API that acts as a “front door” for applications to access data, business logic, or functionality from your back-end services, such as workloads running on Amazon Elastic Compute Cloud (Amazon EC2), code running on AWS Lambda, or any Web application. Amazon API Gateway handles all the tasks involved in accepting and processing up to hundreds of thousands of concurrent API calls, including traffic management, authorization and access control, monitoring, and API version management.
* [AWS CloudFormation](https://aws.amazon.com/cloudformation/) - AWS CloudFormation gives developers and systems administrators an easy way to create and manage a collection of related AWS resources, provisioning and updating them in an orderly and predictable fashion.

----

## Backend API

Spacefinder uses a Serverless API built using Amazon API Gateway, Lambda, DynamoDB, and CloudFormation. The API has the following REST methods, and some methods can only be called by users with "Admin" privileges.

![Spacefinder API](/api/docs/images/spacefinder-api.png?raw=true)

If you only want to quickly run the mobile app to try out the app and see how it leverages different authorization patterns, you do not need to deploy the backend API to your account.

For full visibility into how everything works, you're able to setup the backend API in a fully automated way in your personal AWS account, which will then allow you to tweak settings and better understand the key interactions.

### Installing the prerequisites

    # install the latest Gulp CLI tools globally (you will need a newer version of Gulp CLI which supports Gulp v4)
    npm install gulpjs/gulp-cli -g

    # Checkout the git repo
    git clone https://github.com/awslabs/aws-serverless-auth-reference-app.git
    
    # install the Node modules for the bootstrapping process 
    cd spacefinder/api
    npm install
    
    # install the Node modules for the Lambda run-time
    cd ./lambda
    npm install
    
    # Optional: Update the API config file if you'd like to use a specific non-default AWS profile or different region than us-east-1 to install to.
    # vi spacefinder/api/config.js

    # Run the API automated bootstrapping process to deploy all resources to your account
    # gulp commands need to be run from 'api' directory
    cd ..
    gulp bootstrap

----

## Mobile app

The mobile app is a hybrid mobile app, and is built on the [Ionic2 framework](http://ionicframework.com/docs/v2/), which relies on [Angular 2](https://angular.io/) and [TypeScript 2.0](https://www.typescriptlang.org/index.html). The hybrid mobile app can run on Android devices and iOS devices, as well as a modern web browser.

![Spacefinder Mobile app](/app/docs/images/screenshot-small.png?raw=true)

### Installing the prerequisites

The application framework relies on [Node.js](https://nodejs.org/en/download/) and [npm](https://www.npmjs.com/). It also uses [Apache Cordova](https://cordova.apache.org/) plugins to support certain native functionality on mobile devices.

    # install latest version of the Ionic2 CLI, Cordova, and Bower tools
    npm install -g ionic cordova bower

    # Checkout the git repo (if you haven't already)
    git clone https://github.com/awslabs/aws-serverless-auth-reference-app.git
    
    # install the Node modules 
    cd spacefinder/app
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
using [Chrome's remote debugger tool](https://developers.google.com/web/tools/chrome-devtools/remote-debugging/), and visiting `chrome://inspect` in your Chrome browser.
There are also third-party tools such as [Vysor](https://www.vysor.io/) which can allow you to view your mobile device screen on your computer.

#### Run in an Apple iOS emulator

    ionic run ios
    
 ----
    
### Using the app

#### Sample users and data

As part of the bootstrapping process, sample users and location/resource data were created for you.

Use the following users to login to the application. You may additionally create your own personal accounts.

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

    cd spacefinder/api
    gulp undeploy
