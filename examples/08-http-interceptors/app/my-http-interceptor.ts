import { Injectable } from '@ts-stack/di';
import { HttpHandler, HttpInterceptor, Logger, Request } from '@ditsmod/core';

@Injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  constructor(private req: Request, private logger: Logger) {}

  intercept(next: HttpHandler) {
    // Handling request to `HelloWorldController`
    return next.handle().finally(() => {
      // You can to do something after, for example, log status:
      if (this.req.nodeRes.headersSent) {
        this.logger.info(`MyHttpInterceptor works! Status code: ${this.req.nodeRes.statusCode}`);
      } else {
        this.logger.info('MyHttpInterceptor works! But... Do you forgot send response or just an error occurred?');
      }
    });
  }
}
