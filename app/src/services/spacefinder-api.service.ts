import { Http, RequestOptions } from '@angular/http';
import { Injectable } from "@angular/core";
import { DefaultApi } from "./spacefinder-sdk/api/DefaultApi";
import { UserLoginService } from "./account-management.service";
import { Config } from "../config/config";
import { HttpService } from "./http-service";
import { Logger } from "./logger.service";

declare const awsSignWeb: any;

@Injectable()
export class CustomAuthorizerClient {
  private client: DefaultApi;
  constructor(httpService: HttpService) {
    httpService.addInterceptor((options: RequestOptions) => {
      options.headers.set(
        'Authorization',
        UserLoginService.getIdToken());
      console.log('%cCustom Authorizer Request:\n', Logger.LeadInStyle, options.method, options.url, '\nHeaders:', options.headers['_headersMap'], '\nBody:', options.body);
    });
    this.client = new DefaultApi(<any> httpService, Config.API_ENDPOINT);
  }

  public getClient(): DefaultApi {
    return this.client;
  }
}

@Injectable()
export class IamAuthorizerClient {
  private client: DefaultApi;
  constructor(http: Http) {
    let httpService: HttpService = new HttpService(http);
    httpService.addInterceptor((options: RequestOptions) => {
      var awsSignConfig = {
        // AWS Region (default: 'eu-west-1')
        region: Config.REGION,
        // AWS service that is called (default: 'execute-api' -- AWS API Gateway)
        service: 'execute-api',
        // AWS IAM credentials, here some temporary credentials with a session token
        accessKeyId: UserLoginService.getAwsAccessKey(),
        secretAccessKey: UserLoginService.getAwsSecretAccessKey(),
        sessionToken: UserLoginService.getAwsSessionToken()
      };
      var signer = new awsSignWeb.AwsSigner(awsSignConfig);
      var request = {
        method: options.method,
        url: options.url,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: options.body
      };
      var signed = signer.sign(request);

      options.headers.set('Authorization', signed['Authorization']);
      options.headers.set('Accept', signed['Accept']);
      options.headers.set('Content-Type', signed['Content-Type']);
      options.headers.set('x-amz-date', signed['x-amz-date']);
      options.headers.set('x-amz-security-token', signed['x-amz-security-token']);
      console.log('%cIAM Authorization Request:\n', Logger.LeadInStyle, options.method, options.url, '\nHeaders:', options.headers['_headersMap'], '\nBody:', options.body);
    });
    this.client = new DefaultApi(<any> httpService, Config.API_ENDPOINT);
  }

  public getClient(): DefaultApi {
    return this.client;
  }
}

@Injectable()
export class UserPoolsAuthorizerClient {
  private client: DefaultApi;
  constructor(http: Http) {
    let httpService: HttpService = new HttpService(http);
    httpService.addInterceptor((options: RequestOptions) => {
      options.headers.set(
        'Authorization',
        UserLoginService.getIdToken());
      console.log('%cUser Pools Authorizer Request:\n', Logger.LeadInStyle, options.method, options.url, '\nHeaders:', options.headers['_headersMap'], '\nBody:', options.body);
    });
    this.client = new DefaultApi(<any> httpService, Config.API_ENDPOINT);
  }

  public getClient(): DefaultApi {
    return this.client;
  }
}

@Injectable()
export class NoAuthorizationClient {
  private client: DefaultApi;
  constructor(http: Http) {
    let httpService: HttpService = new HttpService(http);
    httpService.addInterceptor((options: RequestOptions) => {
      console.log('%cRequest without authorization:\n', Logger.LeadInStyle, options.method, options.url, '\nHeaders:', options.headers['_headersMap'], '\nBody:', options.body);
    });
    this.client = new DefaultApi(<any> httpService, Config.API_ENDPOINT);
  }

  public getClient(): DefaultApi {
    return this.client;
  }
}
