
declare namespace awsSignWeb {
    interface Config {
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken?: string;
        region?: string;
        service?: string;
        [propName: string]: any;
    }

    interface Request {
        headers?: any;
        url: string;
        method: string;
        params?: any;
        body?: any;
        data?: any;
        [propName: string]: any;
    }

    class AwsSigner {
        constructor(config: Config);
        sign(request: Request, signDate?: Date): any;
    }
}

export = awsSignWeb;
