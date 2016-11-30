import {Injectable} from "@angular/core";
import {
  Http, Headers, Response, Request, BaseRequestOptions, RequestMethod, RequestOptions,
  ResponseContentType, RequestOptionsArgs
} from "@angular/http";
import {Observable} from "rxjs";

/**
 * We dont extend from Http since by doing that, it requires binding
 * to ConnectionBackend, which is not provided in HttpModule.
 * We cast this one directly with <any> as http, since it implements
 * the same methods than Http.
 */
@Injectable()
export class HttpService {

  private interceptor: (options: RequestOptionsArgs) => void;
  protected _backend;
  protected _defaultOptions;
  constructor(public http: Http) {
    this._backend = (<any>http)._backend;
    this._defaultOptions = (<any>http)._defaultOptions;
  }

  /**
   * Performs a request with `get` http method.
   */
  get(url: string, options?: RequestOptionsArgs): Observable<Response> {
    return this.requestImpl(url, RequestMethod.Get);
  }
  /**
   * Performs a request with `post` http method.
   */
  post(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
    return this.requestImpl(url, RequestMethod.Post, body);
  }
  /**
   * Performs a request with `put` http method.
   */
  put(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
    return this.requestImpl(url, RequestMethod.Put, body);
  }
  /**
   * Performs a request with `delete` http method.
   */
  delete(url: string, options?: RequestOptionsArgs): Observable<Response> {
    return this.requestImpl(url, RequestMethod.Delete);
  }
  /**
   * Performs a request with `patch` http method.
   */
  patch(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
    return this.requestImpl(url, RequestMethod.Patch, body);
  }
  /**
   * Performs a request with `head` http method.
   */
  head(url: string, options?: RequestOptionsArgs): Observable<Response> {
    return this.requestImpl(url, RequestMethod.Head);
  }
  /**
   * Performs a request with `options` http method.
   */
  options(url: string, options?: RequestOptionsArgs): Observable<Response> {
    return this.requestImpl(url, RequestMethod.Options);
  }

  public addInterceptor(cb: (options: RequestOptions) => void) {
    this.interceptor = cb;
  }

  requestImpl(url:string, method:RequestMethod, opt?: RequestOptionsArgs):Observable<Response>{
    let headers = new Headers();
    let options: RequestOptions = new BaseRequestOptions();
    if (!opt) {
      options.url = url;
      options.method =  method;
      options.headers = options.headers || headers;
      options.withCredentials = false;
    } else {
      options.url = url;
      options.method = method;
      options.body = opt.body;
      options.headers = opt.headers || headers;
      options.withCredentials = false;
    }
    options.responseType = ResponseContentType.Json;
    if (this.interceptor) {
      this.interceptor(options);
    }
    // let request = new Request(options);
    return this.http.request(url, options);
  }

  request(url: string | Request, options?: RequestOptionsArgs): Observable<Response> {
    if (typeof url === 'string') {
      if (options && options.method) {
        return this.requestImpl(url, <RequestMethod> options.method, options);
      } else if (options) {
        return this.requestImpl(url, RequestMethod.Get, options);
      } else {
        return this.requestImpl(url, RequestMethod.Get);
      }
    }
  }
}
