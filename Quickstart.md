# Serverless Authentication and Authorization Quickstart Lab

This lab demonstrates how to demo the SpaceFinder reference app, and help you understand the interactions between Cognito User Pools, Cognito Federated Identities, API Gateway, Lambda, and IAM.

**Estimated cost:** If you complete this lab as documented and de-provision all AWS resources afterwards, the estimated cost to run this lab for an hour is $0 for AWS Accounts eligible for the [AWS Free Tier](https://aws.amazon.com/free/), and less than $0.25 for an AWS account ineligible for the [AWS Free Tier](https://aws.amazon.com/free/).

# Here's the high-level plan...

1. **SETUP** (5 minutes): Provision an EC2 instance, and run the Docker container. Configure your AWS credentials, and deploy the AWS resources. Start Ionic 2 server.
1. **INTERACT AND LEARN** (15 minutes): Interact with the hybrid mobile app, and gain insights with the behind-the-scenes info displayed in the browser's JavaScript console. Explore how the AWS resources are configured.
1. **CLEANUP** (1 minute): Stop the Ionic 2 server, and un-deploy the AWS resources.


# SETUP (5 minutes)

Setup is quick and easy. You'll provision an EC2 instance, and run the Docker container. Once your AWS credentials and configured and the AWS resources are deployed, you'll start the Ionic 2 server.

1. **Launch the EC2 instance** in your AWS account, using a public AMI which contains a Docker image with a pre-configured environment:

	- **Public AMI**: `ami-bada16ac`
	- **Instance type**: m4.large
	- **Subnet/AZ:** Launch in any **public** VPC subnet (in any AZ)
	- **Public IP**: Enable "Auto-assign Public IP"
	- **Security Groups:** Open up ports 22 (SSH) and 80 (HTTP) to `0.0.0.0/0`
	- **SSH keypair:** Associate it with an SSH keypair of your choice
1. **SSH into the EC2 instance**.

		ssh -i /path/to/keypair.pem ec2-user@PUBLIC_DNS_OF_YOUR_EC2_SERVER

1. **Once logged in, run the Docker container** in interactive mode. This  command will start the Docker container, and bind the container’s port 8100 to the host EC2 instance’s port 80:

		docker run --rm -it -p 80:8100 awsdevops/aws-serverless-auth-reference-app

	> Troubleshooting: If you encounter a error saying “Bind for 0.0.0.0:80 failed: port is already allocated”, try: `sudo service docker restart`

1. **Create a highly-privileged IAM user, if necessary.** The lab needs permissions to provision/de-provision Cognito User Pools, DynamoDB tables, S3 buckets, Lambda functions, API Gateway configurations, CloudFormation stacks, and IAM roles.
	> All resources are created in your personal AWS account. This lab is self-contained and respectfully cleans up after itself by un-deploying all generated AWS resources.
1. **Configure the AWS credentials** to be used while inside the Docker container.

		aws configure

	> Just accept the defaults when it asks for region and output format. The app configuration file at `~/api/config.js` configures the resources to be provisioned in `us-east-1` by default. Also, AWS credentials are NOT persisted between Docker container runs, so if you exit and later re-run the Docker container, remember to run `aws configure` again.

1. **Deploy the AWS resources into your account**

		cd /home/aws-serverless-auth-reference-app/api
		gulp deploy
		gulp bootstrap

1. **Start the Ionic 2 server.** This starts up the Ionic 2 server listening on port 8100, which is port-mapped (via Docker) to port 80 of the host EC2 instance.

		cd /home/aws-serverless-auth-reference-app/app
		ionic serve
1. **View the hybrid mobile app in your browser**, by visiting:

		http://PUBLIC_DNS_OF_YOUR_EC2_SERVER/

1. **Open the JavaScript console**. As you interact with the hybrid mobile app, useful behind-the-scenes info will appear in the JavaScript console.

	* For example, for Firefox on Mac, the JavaScript console can be toggled via the menu: `Tools > Web Developer > Web Console`. For Chrome on Mac, the menu is: `View > Developer > JavaScript Console`.
	* You may find it helpful to have the JavaScript console display docked on the right side of the browser main window. This will allow you to see both mobile app as well as the JavaScript console output at the same time.

1. **Resize the browser main window**, to simulate the width of a mobile phone. Please be sure that you can see output displayed in the JavaScript console, as you click around the app.

# INTERACT AND LEARN (15 minutes)

Interact with the mobile app, and gain insights by viewing the behind-the-scenes info in the browser's JavaScript console. Explore how the AWS resources are configured.

1. **Sign-up as new user in the hybrid mobile app, using your e-mail address**
1. **Provide confirmation code from e-mail to validate e-mail and confirm registration**
1.**Sign-in as your new user**
	- Review the output in the browser's JavaScript console.
      - <span style='color:green'>How many JWT tokens are returned from Cognito User Pools?</span>
      - <span style='color:green'>Which AWS credential components are returned from Cognito Federated Identities?</span>
	- Copy/paste the identity token into the JWT debugger at `http://jwt.io`, and decode it to see the base64-decoded content of the JWT.
		- How long is the identity token valid for before it expires?
    - Which attributes are encoded inside of the token?
	- Copy/paste the access token into the JWT debugger at `http://jwt.io`, and decode it to see the base64-decoded content of the JWT.
		- How long is the access token valid for before it expires?
    - Which attributes are encoded inside of the token?
    - Which attributes are the same as the ones in the identity token? Which ones are different?
1. **Browse to "Resources" tab in the mobile app**
1. **Attempt to load locations “without Auth"**
	- Notice the exact HTTP request in the developer console and the headers sent.
	- Notice an error is returned with a `401` status code.
1.	Attempt to load locations “with Auth”
	- Notice the headers sent to the backend with this request
1.	Select a location
	- Notice the IAM signing and headers sent with request to the backend
1.	Select an available timeslot and “Book resource”
	- Notice the POST request and headers sent with request to the backend
1.	Browse to “Bookings” tab and cancel booking
	- Notice the API request and headers sent
1.	Browse to “Account” tab
	- Select to upload an image locally as your profile picture. Any image will do.
	- Notice how the AWS creds retrieved from Cognito Federated Identities are used to upload object
1.	Toggle on “Administrator” features (note that you are NOT signed in currently as an administrator)
1.	Browse back to “Resources” tab
1.	Select to “Add location”
1.	Fill in requested information and click “Add location” button
	- Notice how request is rejected
18.	In a new browser tab/window, browse to API Gateway console and “Authorizers” section of API
	- Paste in identity token from your sign-in to retrieve active policy returned by custom authorizer
	- Notice that it doesn’t allow access to `POST` to `/locations` path
	- Do not close this tab/window
1.	Sign-out from application
1.	Sign-in as `admin1` user with default password
1.	Attempt to add a location again
	- Notice that this time it succeeds
1.	Return to API gateway custom authorizer tester and paste in the `admin1` user’s identity token
	- Notice that the effective policy for this user includes a lot more, including access to `POST` to `/locations`
1. Browse to `https://github.com/awslabs/aws-serverless-auth-reference-app/blob/master/api/lambda/authorizer.js`
	- Notice how custom authorizer works and what it evaluates
	- Which validations should be added to a custom authorizer to ensure you’ve covered all of the core cases?
1. Browse to Cognito User Pools console
1. Evaluate attributes section for user pool
1. Evaluate the validations section
	- Notice the requirement of e-mail verification
1. Evaluate the “apps” section
	- Notice that the app has been granted write permissions to many areas
1. Evaluate the “groups” section
	- Notice that there are two groups
1. Browse to Cognito Federated Identities console

# CLEANUP (1 minute)

Cleanup is fast and easy. This lab is self-contained and cleans up after itself by un-deploying all auto-generated AWS resources).

1. **Exit Ionic 2 console and stop the Ionic server.**
	- `Control-C` or `q` (for quit) will exit the Ionic 2 console.

1. **Un-deploy all AWS resources**:

		cd /home/aws-serverless-auth-reference-app/api
	 	gulp undeploy

1. **Exit the Docker container**

	- Type `exit` at the command line.

1. **Terminate the EC2 instance.**
