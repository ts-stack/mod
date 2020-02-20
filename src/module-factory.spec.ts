import 'reflect-metadata';
import { ReflectiveInjector, Injectable, Type, Provider } from 'ts-di';

import { ModuleFactory } from './module-factory';
import { NormalizedProvider } from './utils/ng-utils';
import { Module, ModuleMetadata, defaultProvidersPerReq, ModuleType, ModuleWithOptions } from './decorators/module';
import { Controller } from './decorators/controller';
import { Route } from './decorators/route';
import { Router, RouteConfig } from './types/router';
import { defaultProvidersPerApp, RootModule } from './decorators/root-module';
import { Column } from './modules/orm/decorators/column';
import { Logger } from './types/logger';

describe('ModuleFactory', () => {
  @Injectable()
  class MockModuleFactory extends ModuleFactory {
    log: Logger;
    routesPrefixPerApp: string;
    routesPrefixPerMod: string;
    moduleName = 'MockModule';
    opts = new ModuleMetadata();
    router: Router;
    injectorPerMod: ReflectiveInjector;
    testOptionsMap = new Map<Type<any>, ModuleMetadata>();

    initProvidersPerReq() {
      return super.initProvidersPerReq();
    }

    quickCheckImports(moduleMetadata: ModuleMetadata) {
      return super.quickCheckImports(moduleMetadata);
    }

    getRawModuleMetadata(typeOrObject: Type<any> | ModuleWithOptions<any>) {
      return super.getRawModuleMetadata(typeOrObject);
    }

    mergeMetadata(mod: ModuleType) {
      return super.mergeMetadata(mod);
    }

    exportProvidersToImporter(
      typeOrObject: Type<any> | ModuleWithOptions<any>,
      isStarter: boolean,
      soughtProvider?: NormalizedProvider
    ) {
      return super.exportProvidersToImporter(typeOrObject, isStarter, soughtProvider);
    }

    loadRoutesConfig(prefix: string, configs: RouteConfig[]) {
      return super.loadRoutesConfig(prefix, configs);
    }
  }

  class MyLogger extends Logger {
    debug = (...args: any[]): any => {
      console.log(`debug:\n ${'*'.repeat(50)}\n`, ...args);
    };
  }

  const log = new MyLogger();

  let mock: MockModuleFactory;
  beforeEach(() => {
    mock = new MockModuleFactory(null, null, log);
  });

  class ClassWithoutDecorators {}

  describe('mergeMetadata()', () => {
    it('should set default metatada', () => {
      @Module()
      class ClassWithDecorators {}
      const metadata = mock.mergeMetadata(ClassWithDecorators);
      expect(metadata.controllers).toEqual([]);
      expect(metadata.exports).toEqual([]);
      expect(metadata.imports).toEqual([]);
      expect(metadata.routesPerMod).toEqual([]);
      expect(metadata.providersPerMod).toEqual([]);
      expect(metadata.providersPerReq).toEqual([]);
      expect((metadata as any).ngMetadataName).toBe('Module');
    });

    it('should merge default metatada with ClassWithDecorators metadata', () => {
      class SomeControllerClass {}
      class C1 {}
      class PerMod {}

      const routesPerMod = [{ path: '1', controller: C1 }];

      @Module({
        controllers: [SomeControllerClass],
        providersPerReq: [ClassWithoutDecorators],
        providersPerMod: [PerMod],
        routesPerMod
      })
      class ClassWithDecorators {}
      const metadata = mock.mergeMetadata(ClassWithDecorators);
      expect(metadata.controllers).toEqual([SomeControllerClass]);
      expect(metadata.exports).toEqual([]);
      expect(metadata.imports).toEqual([]);
      expect(metadata.routesPerMod).toEqual(routesPerMod);
      expect(metadata.providersPerMod).toEqual([PerMod]);
      expect(metadata.providersPerReq).toEqual([ClassWithoutDecorators]);
    });

    it('ClassWithoutDecorators should not have metatada', () => {
      const msg = `Module build failed: module "ClassWithoutDecorators" does not have the "@Module()" decorator`;
      expect(() => mock.mergeMetadata(ClassWithoutDecorators)).toThrowError(msg);
    });
  });

  describe('quickCheckImports()', () => {
    it('should throw an error, when no export and no controllers', () => {
      class Provider11 {}
      class Provider12 {}

      @Module({
        providersPerMod: [Provider11, Provider12]
      })
      class Module1 {}

      const moduleMetadata = mock.mergeMetadata(Module1);
      expect(() => mock.quickCheckImports(moduleMetadata)).toThrow(
        `Import MockModule failed: this module should have some controllers or "exports" array with elements.`
      );
    });

    it('should throw an error, when no export and no controllers', () => {
      class Provider11 {}
      class Provider12 {}

      @Module({
        providersPerMod: [Provider11, Provider12]
      })
      class Module1 {}

      @Module({
        imports: [Module1]
      })
      class Module2 {}

      const moduleMetadata = mock.mergeMetadata(Module2);
      expect(() => mock.quickCheckImports(moduleMetadata)).toThrow(
        `Import MockModule failed: this module should have some controllers or "exports" array with elements.`
      );
    });

    it('should not throw an error, when export some provider', () => {
      class Provider11 {}
      class Provider12 {}

      @Module({
        exports: [Provider11],
        providersPerMod: [Provider11, Provider12]
      })
      class Module1 {}

      const moduleMetadata = mock.mergeMetadata(Module1);
      expect(() => mock.quickCheckImports(moduleMetadata)).not.toThrow();
    });

    it('should not throw an error, when export some controller', () => {
      class Provider11 {}
      class Provider12 {}

      @Module({
        controllers: [Provider11],
        providersPerMod: [Provider11, Provider12]
      })
      class Module1 {}

      const moduleMetadata = mock.mergeMetadata(Module1);
      expect(() => mock.quickCheckImports(moduleMetadata)).not.toThrow();
    });
  });

  describe('getRawModuleMetadata()', () => {
    class SomeControllerClass {}

    it('should returns ClassWithDecorators metadata', () => {
      @Module({ controllers: [SomeControllerClass] })
      class ClassWithDecorators {}
      const metadata = mock.getRawModuleMetadata(ClassWithDecorators);
      expect(metadata).toEqual(new Module({ controllers: [SomeControllerClass] }));
    });

    it('should not returns any metadata', () => {
      const metadata = mock.getRawModuleMetadata(ClassWithoutDecorators);
      expect(metadata).toBeUndefined();
    });
  });

  describe('loadRoutesConfig() and setRoutes()', () => {
    @Controller()
    class C1 {
      @Column() // <----- It's just to mix `@Route()` with another decorators.
      @Route('GET')
      method() {}
    }
    @Controller()
    class C11 {
      @Route('GET')
      @Column() // <----- It's just to mix `@Route()` with another decorators.
      method() {}
    }
    @Controller()
    class C12 {
      @Route('GET')
      method() {}
    }
    @Controller()
    class C13 {
      @Route('GET')
      method() {}
    }
    @Controller()
    class C121 {
      @Route('GET')
      method() {}
    }
    @Controller()
    class C122 {
      @Route('POST')
      method() {}
    }
    @Controller()
    class C131 {
      @Route('GET')
      method() {}
    }
    @Controller()
    class C21 {
      @Route('GET')
      method() {}
    }
    @Controller()
    class C3 {
      @Route('GET')
      method() {}
    }

    const routesPerMod: RouteConfig[] = [
      {
        path: '1',
        controller: C1,
        children: [
          { path: '11', controller: C11 },
          {
            path: '12',
            controller: C12,
            children: [
              { path: '121', controller: C121 },
              { path: '122', controller: C122 }
            ]
          },
          {
            path: '13',
            controller: C13,
            children: [{ path: '131', controller: C131 }]
          }
        ]
      },
      {
        path: '2',
        children: [{ path: '21', controller: C21 }]
      },
      {
        path: '3',
        controller: C3
      }
    ];

    it('router should includes the routes from routes configs', () => {
      const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp as Provider[]);

      mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
      mock.injectorPerMod = injectorPerApp;
      mock.loadRoutesConfig('api', routesPerMod);
      expect(mock.router.find('GET', '').handle).toBeNull();
      expect(mock.router.find('GET', '/api').handle).toBeNull();
      expect(mock.router.find('GET', '/api/1').handle().controller).toBe(C1);
      expect(mock.router.find('GET', '/api/1/12').handle().controller).toBe(C12);
      expect(mock.router.find('GET', '/api/1/12/121').handle().controller).toBe(C121);
      expect(mock.router.find('POST', '/api/1/12/122').handle().controller).toBe(C122);
      expect(mock.router.find('GET', '/api/1/13').handle().controller).toBe(C13);
      expect(mock.router.find('GET', '/api/1/13/131').handle().controller).toBe(C131);
      expect(mock.router.find('GET', '/api/2/21').handle().controller).toBe(C21);
      expect(mock.router.find('GET', '/api/3').handle().controller).toBe(C3);
      expect(mock.router.find('GET', '/api/4').handle).toBeNull();
    });
  });

  describe('bootstrap()', () => {
    class Provider0 {}
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}
    class Provider8 {}
    class Provider9 {}

    @Module({
      exports: [Provider0],
      providersPerMod: [Provider0]
    })
    class Module0 {}

    @Module({
      imports: [Module0],
      exports: [Module0, Provider1, Provider2, Provider3],
      providersPerMod: [Provider1, Provider2, Provider3]
    })
    class Module1 {}

    @Module({
      imports: [Module1],
      exports: [Provider1, Provider3, Provider5, Provider8],
      providersPerMod: [Provider4, Provider5, Provider6],
      providersPerReq: [Provider7, Provider8]
    })
    class Module2 {}

    @Controller()
    class Ctrl {
      @Route('GET')
      method() {}
    }

    @Module({
      imports: [Module2],
      exports: [Module2],
      providersPerReq: [Provider9],
      controllers: [Ctrl]
    })
    class Module3 {}

    it(`Module3 should have Provider1, Provider3, Provider5 in providersPerMod and Provider31 in providersPerReq`, () => {
      const injectorPerApp = ReflectiveInjector.resolveAndCreate([
        ...defaultProvidersPerApp,
        { provide: Logger, useClass: MyLogger }
      ]);

      mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
      mock.injectorPerMod = injectorPerApp;
      mock.bootstrap('api', '', Module3);
      expect(mock.routesPrefixPerApp).toBe('api');

      const mod0 = mock.testOptionsMap.get(Module0);
      expect(mod0.providersPerMod).toEqual([Provider0]);
      expect(mod0.providersPerReq).toEqual(defaultProvidersPerReq);
      expect((mod0 as any).ngMetadataName).toBe('Module');

      const mod1 = mock.testOptionsMap.get(Module1);
      expect(mod1.providersPerMod).toEqual([Provider0, Provider1, Provider2, Provider3]);
      expect(mod1.providersPerReq).toEqual(defaultProvidersPerReq);
      expect((mod1 as any).ngMetadataName).toBe('Module');

      const mod2 = mock.testOptionsMap.get(Module2);
      expect(mod2.providersPerMod).toEqual([
        Provider0,
        Provider1,
        Provider2,
        Provider3,
        Provider4,
        Provider5,
        Provider6
      ]);
      expect(mod2.providersPerReq).toEqual([...defaultProvidersPerReq, Provider7, Provider8]);
      expect((mod2 as any).ngMetadataName).toBe('Module');

      const mod3 = mock.testOptionsMap.get(Module3);
      expect(mod3.providersPerMod).toEqual([Provider1, Provider3, Provider5]);
      expect(mod3.providersPerReq).toEqual([Ctrl, ...defaultProvidersPerReq, Provider8, Provider9]);
      expect(mod3.controllers).toEqual([Ctrl]);
      expect((mod3 as any).ngMetadataName).toBe('Module');
    });

    @RootModule({
      imports: [Module3]
    })
    class Module4 {}

    it(`Module4 should have Provider1, Provider3, Provider5 in providersPerMod`, () => {
      const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp as Provider[]);
      mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
      mock.injectorPerMod = injectorPerApp;
      mock.bootstrap('some', 'other', Module4);

      expect(mock.routesPrefixPerApp).toBe('some');
      expect(mock.routesPrefixPerMod).toBe('other');
      expect(mock.router.find('GET', '/some/other').handle().controller).toBe(Ctrl);
      expect(mock.opts.providersPerMod).toEqual([Provider1, Provider3, Provider5]);
      expect(mock.opts.providersPerReq).toEqual([...defaultProvidersPerReq, Provider8]);
      expect((mock.opts as any).ngMetadataName).toBe('RootModule');
    });

    @Module({
      imports: [Module3]
    })
    class Module5 {}

    it(`should throw an error regarding the provider's absence`, () => {
      const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp as Provider[]);
      mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
      mock.injectorPerMod = injectorPerApp;
      const errMsg = `Import Module5 failed: this module should have some controllers or "exports" array with elements.`;
      expect(() => mock.bootstrap('api', '', Module5)).toThrow(errMsg);
    });

    @Module({
      exports: [Provider1, Provider2, Provider3],
      providersPerMod: [Provider1, Provider3]
    })
    class Module6 {}

    @Module({
      imports: [Module6]
    })
    class Module7 {}

    it(`should throw an error about not proper provider exports`, () => {
      const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp as Provider[]);
      mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
      mock.injectorPerMod = injectorPerApp;
      const errMsg = `Exported Provider2 from Module6 should includes in "providersPerMod" or "providersPerReq", or in some "exports" of imported modules.`;
      expect(() => mock.bootstrap('api', '', Module7)).toThrow(errMsg);
    });
  });
});
