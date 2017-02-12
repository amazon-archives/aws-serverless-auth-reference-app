# Dockerfile for aws-serverless-auth-reference-app, to make it easy to quickly try out the mobile app
#
# Build Docker image
# docker build -t aws-serverless-auth-reference-app https://github.com/awslabs/aws-serverless-auth-reference-app.git
# docker build -t aws-serverless-auth-reference-app .

# Run Docker image
# docker run --rm -it -p 8100:8100 -p 35729:35729 aws-serverless-auth-reference-app

# # once you're running inside the Docker container
# aws configure  # make sure to choose us-east-1 as the region
#   - aws_access_key_id = AKIAI3YTODSF37ITIYQA
#   - aws_secret_access_key = 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
# cd ./api
# gulp deploy
# gulp bootstrap
# cd ../app
# ionic serve
# use http://localhost:8100 to browse and test app

# q to quit Ionic
# exit to exit the Docker container

#=========================================================================


FROM library/ubuntu:16.04
MAINTAINER Jim Tran and Justin Pirtle
WORKDIR /home/
ENV DIRPATH /home/aws-serverless-auth-reference-app/

# update apt repository packages
RUN apt-get update

# install the AWS CLI and Python pip dependency
RUN apt-get install -y python-pip
RUN pip install awscli

# install Node.js
RUN apt-get install -y python-software-properties
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get install -y nodejs

# set the Node.js npm logger level for build visibility (logging minimized by default)
# RUN npm config set loglevel info

# install git and pull down source code
RUN apt-get install -y git
RUN git clone https://github.com/awslabs/aws-serverless-auth-reference-app
RUN DIRPATH=$(pwd)/aws-serverless-auth-reference-app

# install the latest Gulp CLI tools globally (you will need a newer version of Gulp CLI which supports Gulp v4)
RUN npm install gulpjs/gulp-cli -g

# install the Node modules for the bootstrapping process
WORKDIR $DIRPATH/api/
RUN npm install

# install the Node modules for the Lambda run-time
WORKDIR $DIRPATH/api/lambda
RUN npm install

# install latest version of the Ionic2 CLI, Cordova, and Bower tools
RUN npm install -g ionic cordova bower
WORKDIR $DIRPATH/app
RUN npm install

# install the Bower crypto components (for AWS request signing) - omitted for now since bower components are statically embedded
# RUN echo '{ "allow_root": true }' > /root/.bowerrc
# RUN bower install

# install Cordova platform components if you would like to build the app for mobile
RUN cordova platform remove android
RUN cordova platform remove ios
RUN cordova platform add android@5.X.X
RUN cordova platform add ios@4.X.X

# change prompt color
RUN echo 'export PS1="\[\033[0;33m\][Docker container (aws-serverless-auth-reference-app): \w]  \[\033[0m\]"' >> /root/.bashrc

# start new shell with new prompt color
RUN bash

# Expose the Ionic ports
EXPOSE 8100 35729
WORKDIR $DIRPATH

# ENTRYPOINT aws configure && (cd api && gulp deploy) && (cd api && gulp generate_sample_users) && (cd api && gulp generate_sample_data) && (cd app && ionic serve) && (cd api && gulp undeploy)
