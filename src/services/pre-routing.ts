import { parse } from 'querystring';
import { Injectable, TypeProvider } from '@ts-stack/di';

import { NodeReqToken, NodeResToken } from '../types/injection-tokens';
import { PreRouteData } from '../decorators/controller';
import { Logger } from '../types/logger';
import { NodeRequest, NodeResponse } from '../types/server-options';
import { AppMetadata } from '../decorators/app-metadata';
import { PreRequest } from './pre-request';
import { Request } from './request';
import { ObjectAny, ControllerErrorHandler } from '../types/types';
import { BodyParser } from './body-parser';
import { CanActivate } from '../decorators/route';
import { NormalizedGuard, RouteParam, Router } from '../types/router';

@Injectable()
export class PreRouting {
  constructor(
    protected router: Router,
    protected log: Logger,
    protected appMetadata: AppMetadata,
    protected preRequest: PreRequest
  ) {}

  setRoutes(moduleName: string, prefixPerApp: string, prefixPerMod: string, preRoutesData: PreRouteData[]) {
    this.checkRoutePath(moduleName, prefixPerApp);
    this.checkRoutePath(moduleName, prefixPerMod);
    const prefix = [prefixPerApp, prefixPerMod].filter((s) => s).join('/');

    preRoutesData.forEach((preRouteData) => {
      const route = preRouteData.route;
      const path = this.getPath(prefix, route.path);
      /**
       * @param injector Injector per module that tied to the route.
       * @param providers Resolved providers per request.
       * @param method Method of the class controller.
       * @param parseBody Need or not to parse body.
       */
      const { injector, providers, controller, methodName, parseBody, guards } = preRouteData;

      this.router.on(
        route.httpMethod,
        `/${path}`,
        (nodeReq: NodeRequest, nodeRes: NodeResponse, params: RouteParam[], queryString: any) => {
          nodeRes.setHeader('Server', this.appMetadata.serverName);
          const injector1 = injector.resolveAndCreateChild([
            { provide: NodeReqToken, useValue: nodeReq },
            { provide: NodeResToken, useValue: nodeRes },
          ]);
          const injector2 = injector1.createChildFromResolved(providers);
          const req = injector2.get(Request) as Request;
          this.handleRoute(req, params, queryString, controller, methodName, parseBody, guards);
        }
      );

      const logObj = {
        methodId: preRouteData.methodId,
        decoratorId: preRouteData.decoratorId,
        module: moduleName,
        httpMethod: route.httpMethod,
        path,
        guards: preRouteData.guards,
        handler: `${preRouteData.controller.name}.${preRouteData.methodName}()`,
      };

      if (!logObj.guards.length) {
        delete logObj.guards;
      }

      this.log.trace(logObj);
    });
  }

  /**
   * Called by the `Application` after founded a route.
   *
   * @param controller Controller class.
   * @param method Method of the Controller.
   * @param parseBody Need or not to parsing a body request.
   */
  protected async handleRoute(
    req: Request,
    pathParamsArr: RouteParam[],
    queryString: string,
    controller: TypeProvider,
    method: string,
    parseBody: boolean,
    guardItems: NormalizedGuard[]
  ) {
    let errorHandler: ControllerErrorHandler;
    let ctrl: any;
    let preparedGuardItems: { guard: CanActivate; params?: any[] }[] = [];

    try {
      req.pathParamsArr = pathParamsArr;
      const pathParams: ObjectAny = pathParamsArr ? {} : undefined;
      pathParamsArr?.forEach((param) => (pathParams[param.key] = param.value));
      req.pathParams = pathParams;

      errorHandler = req.injector.get(ControllerErrorHandler);
      preparedGuardItems = guardItems.map((item) => {
        return {
          guard: req.injector.get(item.guard),
          params: item.params,
        };
      });
      ctrl = req.injector.get(controller);
    } catch (err) {
      this.preRequest.sendInternalServerError(req.nodeRes, err);
      return;
    }

    try {
      for (const item of preparedGuardItems) {
        const canActivate = await item.guard.canActivate(item.params);
        if (canActivate !== true) {
          const status = typeof canActivate == 'number' ? canActivate : undefined;
          this.preRequest.canNotActivateRoute(req.nodeReq, req.nodeRes, status);
          return;
        }
      }

      req.queryParams = parse(queryString);
      if (parseBody) {
        const bodyParser = req.injector.get(BodyParser) as BodyParser;
        req.body = await bodyParser.getBody();
      }

      await ctrl[method]();
    } catch (err) {
      errorHandler.handleError(err);
    }
  }

  /**
   * Compiles the path for the controller given the prefix.
   *
   * - If prefix `/api/posts/:postId` and route path `:postId`, this method returns path `/api/posts/:postId`.
   * - If prefix `/api/posts` and route path `:postId`, this method returns `/api/posts/:postId`
   */
  protected getPath(prefix: string, path: string) {
    const prefixLastPart = prefix?.split('/').slice(-1)[0];
    if (prefixLastPart?.charAt(0) == ':') {
      const reducedPrefix = prefix?.split('/').slice(0, -1).join('/');
      return [reducedPrefix, path].filter((s) => s).join('/');
    } else {
      return [prefix, path].filter((s) => s).join('/');
    }
  }

  protected checkRoutePath(moduleName: string, path: string) {
    if (path?.charAt(0) == '/') {
      throw new Error(`Invalid configuration of route '${path}' (in '${moduleName}'): path cannot start with a slash`);
    }
  }
}
