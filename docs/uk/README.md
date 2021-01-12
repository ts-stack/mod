# Що таке Ditsmod

Ditsmod є Node.js веб-фреймворком, його назва складається із **DI** + **TS** + **Mod**, щоб підкреслити важливі складові: він має **D**ependency **I**njection, написаний на **T**ype**S**cript, та спроектований для хорошої **Mod**ularity (тобто модульності).

Головні особливості Ditsmod:
- Зручний механізм [указання та вирішення залежностей][8] між різними класами застосунку: ви в конструкторі указуєте інстанси яких класів вам потрібні, а DI бере на себе непросту задачу "де їх взяти".
- Можливість легко підмінювати by default класи в ядрі Ditsmod своїми власними класами. Наприклад, швидше за все, ви захочете підмінити клас логера на ваш власний клас, оскільки by default логер нічого не записує ні в консоль, ні у файл.
- Можливість легко підмінювати класи вашого застосунку тестовими класами (mocks, stubs), не змінюючи при цьому код вашого застосунку. Це дуже суттєво спрощує тестування.
- Ditsmod спроектований, щоб забезпечувати хорошу модульність всього застосунку, а отже і хорошу масштабованість. Його DI підтримує ієрархію, а це означає, що ви можете оголошувати [одинаків][12]: або на рівні усього застосунку, або на рівні конкретного модуля, або на рівні HTTP-запиту.

Ті, хто знайомий з [Angular][9], помітить, що деякі концепції архітектури цього фреймворка дуже схожі на Angular концепції. Це справді так, більше того - сам [DI][11] фактично витягнутий з Angular v4.4.7. (з мінімальними допрацюваннями) та інтегрований в Ditsmod.

## Зміст

- [Встановлення](#встановлення)
- [Запуск](#запуск)
- [Ознайомлення з Ditsmod](#ознайомлення-з-ditsmod)

## Встановлення

Мінімальний базовий набір для роботи застосунку має репозиторій [ditsmod-seed][2].
Клонуйте його та встановіть залежності:

```bash
git clone git@github.com:ts-stack/ditsmod-seed.git my-app
cd my-app
npm i
```

Окрім цього, можете проглянути більше прикладів у теці [examples][4].

## Запуск

```bash
npm start
```

Перевірити роботу сервера можна за допомогою `curl`:

```bash
curl -isS localhost:8080
```

## Ознайомлення з Ditsmod

Після [встановлення Ditsmod seed](#встановлення), перше, що необхідно знати: весь код застосунку знаходиться у теці `src`, він компілюється за допомогою TypeScript-утиліти `tsc`, після компіляції попадає у теку `dist`, і далі вже у вигляді JavaScript-коду його можна виконувати у Node.js.

Давайте розглянемо файл `src/main.ts`:

```ts
import 'reflect-metadata';
import { AppFactory } from '@ts-stack/ditsmod';

import { AppModule } from './app/app.module';

new AppFactory()
  .bootstrap(AppModule)
  .then(({ server, log }) => {
    server.on('error', (err) => log.error(err));
  })
  .catch(({ err, log }) => {
    log.fatal(err);
    throw err;
  });
```

Після компіляції, він перетворюється на `dist/main.js` та стає вхідною точкою для запуску застосунку, і саме тому ви будете його вказувати у якості аргументу для Node.js:

```bash
node dist/main.js
```

Слід звернути увагу на `import 'reflect-metadata'` у першому рядку файла. Цей модуль необхідний для роботи Ditsmod, але його достатньо указувати єдиний раз у вхідному файлі для Node.js.

Бажано запам'ятати дане правило на майбутнє, і застосовувати його також для написання тестів, оскільки в такому разі вхідним файлом вже буде файл тесту, а не `dist/main.js`. Наприклад, якщо ви будете використовувати [jest][10] у якості фреймворку для тестів, а файл `path/to/test-file.js` міститиме скомпільований тест, то щоб запустити його ось так:

```bash
jest path/to/test-file.js
```

у файлі `path/to/test-file.js` повинен бути імпорт `reflect-metadata`.

Проглядаючи далі файл `src/main.ts`, ми бачимо, що створюється інстанс класу `AppFactory`, а у якості аргументу для методу `bootstrap()` передається `AppModule`. Тут `AppModule` є кореневим модулем, до якого вже підв'язуються інші модулі застосунку.

## Складові архітектури Ditsmod

Для опису основних складових архітектури Ditsmod, будуть використовуватись такі поняття:
- кореневий модуль
- контролер
- роут
- сервіс
- модуль
- модуль з провайдером
- DI (англ. **D**ependency **I**njection), інжектор, токен
- провайдер сервіса
- три рівня оголошення провайдерів.

### Кореневий модуль Ditsmod

До кореневого модуля підв'язуються інші модулі, він є єдиним на увесь застосунок.
TypeScript клас стає кореневим модулем Ditsmod завдяки декоратору `RootModule`:

```ts
import { RootModule } from '@ts-stack/ditsmod';

@RootModule()
export class AppModule {}
```

Щоб запустити порожній застосунок, цього вже буде достатньо. Але для повноцінної роботи,
щоб можна було обробляти певні URL маршрути, потрібні контролери.

### Контролер

TypeScript клас стає контролером Ditsmod завдяки декоратору `Controller`:

```ts
import { Controller } from '@ts-stack/ditsmod';

@Controller()
export class HelloWorldController {}
```

Як і належить кожному контролеру, він повинен містити маршрути (Route), а також,
як мінімум, повинен мати доступ до об'єкта відповіді (Response). В наступному прикладі створено два маршрути,
що приймають `GET` запити за адресами `/` та `/throw-error`.
Зверніть також увагу як у конструкторі ми отримуємо інстанс класу `Response`:

```ts
import { Controller, Response, Route } from '@ts-stack/ditsmod';

@Controller()
export class HelloWorldController {
  constructor(private res: Response) {}

  @Route('GET')
  tellHello() {
    this.res.send('Hello World!\n');
  }

  @Route('GET', 'throw-error')
  thrwoError() {
    throw new Error('Here some error occurred');
  }
}
```

Що ми тут бачимо:
1. В конструкторі класу за допомогою модифікатора доступу `private` оголошується властивість класу `res` із типом даних `Response`.
1. Маршрути створюються за допомогою декоратора `Route`, що ставиться перед методом класу.
1. Відповіді на HTTP-запити відправляються через `this.res.send()` (хоча `this.res` ще має `sendJson()` та `sendText()`).
1. Об'єкти помилок можна кидати прямо в методі класу звичайним для JavaScript способом, тобто за допомогою ключового слова `throw`.

**Уточнення**: модифікатор доступу в конструкторі може бути будь-яким (`private`, `protected` або `private`),
але взагалі без модифікатора, `res` вже буде простим параметром з видимістю лише в конструкторі.

Щойно в конструкторі ми отримали інстанс класу `Response`, а він якраз і представляє собою сервіс,
що згадувався раніше як [складова архітектури Ditsmod](#складові-архітектури-ditsmod).

## Сервіс

TypeScript клас стає сервісом Ditsmod завдяки декоратору `Injectable`:

```ts
import { Injectable } from '@ts-stack/di';

@Injectable()
export class SomeService {}
```

Зверніть увагу, що цей декоратор імпортується із `@ts-stack/di`, а не із `@ts-stack/ditsmod`.
Приклади сервісів в затосунках Ditsmod:
- сервіс надання конфігурації;
- сервіс роботи з базами даних, з поштою і т.п.;
- сервіс парсингу тіла HTTP-запиту;
- сервіс перевірки прав доступу;
- і т.д.

Часто одні сервіси залежать від інших сервісів, і щоб отримати інстанс певного сервіса,
необхідно указати його клас в конструкторі:

```ts
import { Injectable } from '@ts-stack/di';

import { OtherService } from './other-service';

@Injectable()
export class SomeService {
  constructor(private otherService: OtherService) {}

  methodOne() {
    this.otherService.doSomeThing();
  }
}
```

Як бачите, правила отримання інстансу класа сервіса в іншому сервісі такі ж самі, як і в контролері.
Тобто, ми в конструкторі класу за допомогою модифікатора доступу `private` оголошуємо властивість
класу `otherService` із типом даних `OtherService`. Цим займається система впровадження залежностей (англ. Dependency Injection).

**Уточнення**: модифікатор доступу в конструкторі може бути будь-яким (`private`, `protected` або `private`),
але взагалі без модифікатора, `otherService` вже буде простим параметром з видимістю лише в конструкторі.

## Впровадження залежностей (англ. Dependency Injection)

**Примітка** В даній документації [впровадження залежностей][8] буде скорочено називатись DI від англ. "Dependency Injection".

Щоб надавати в конструкторі класу нам те, що ми запитуємо, DI повинен бути проінструктований звідки це брати.
І це може здатись дивним. Чому? - Давайте глянемо на приклад:

```ts
import { Injectable } from '@ts-stack/di';

import { OtherService } from './other-service';

@Injectable()
export class SomeService {
  constructor(private otherService: OtherService) {}

  methodOne() {
    this.otherService.doSomeThing();
  }
}
```

Тут DI повинен створити інстанс класу `OtherService` і, на перший погляд, ми чітко прописуємо звідки імпортувати цей клас,
але цього не достатньо. Справа в тому, що DI має ще систему **провайдерів** та систему **життєвого циклу** інстансів цих провайдерів.

Не змінюючи коду в даному прикладі, ми можемо підмінити клас `OtherService`, наприклад, тестовим класом.
Коли ми підмінюємо один клас іншим класом ми, можна сказати, надаємо інший **провайдер** для створення інстансу класу `OtherService`.
Причому цих провайдерів може бути багато, але DI вибирає завжди той із них, що вказаний самим останнім (механізм указання провайдерів див. далі).

Точно так само, не змінюючи коду прикладу, ми ще можемо
змінити **період життя** інстансу класа `OtherService` він може створюватись:
- або один єдиний раз при старті застосунку
- або кожен раз, коли його імпортують в черговий модуль
- або за кожним HTTP-запитом.

Оскільки, не змінюючи коду цього прикладу, ми можемо отримувати різні результати у властивості `otherService`, виходить, що не достатньо просто
указати `import { OtherService } from './other-service'`. Щоб однозначно визначити результати у властивості `otherService`,
необхідно додатково оголосити період життя провайдера `OtherService`, а також, при необхідності, підмінити його іншим класом.

### Оголошення життя провайдерів

Таке оголошення робиться або у метаданих модуля, або контролера. Наприклад, в контролері можна
оголосити провайдерів з періодом життя "HTTP-запит":

```ts
import { Controller } from '@ts-stack/ditsmod';

import { OtherService } from './other-service';

@Controller({ providersPerReq: [ OtherService ] })
export class HelloWorldController {}
```

Як бачимо, в метаданих переданих в декоратор `Controller` передається об'єкт із властивістю `providersPerReq`,
куди передається масив провайдерів. Таким чином ми оголошуємо

## Домовленості по іменуванню файлів та класів
## Підсумок

В декоратор кореневого модуля можуть передаватись метадані:

```ts
import * as http from 'http';
import { RootModule } from '@ts-stack/ditsmod';

/**
 * Any one of these options are optional.
 */
@RootModule({
  httpModule: http,
  serverName: 'Node.js',
  serverOptions: {},
  listenOptions: { port: 8080, host: 'localhost' },
  prefixPerApp: '',
  imports: [],
  exports: [],
  controllers: [],
  providersPerApp: [],
  providersPerMod: [],
  providersPerReq: [],
})
export class AppModule {}
```

Властивості `imports` та `exports` приймають класи модулів. Усі сервіси, що імпортуються у кореневий модуль,
стають доступним лише для цього модуля, а усі сервіси, що він експортує, стають доступними на рівні застосунку.

### Модуль Ditsmod

TypeScript клас стає модулем Ditsmod завдяки декоратору `Module`, в який передаються наступні метадані:

```ts
import { Module } from '@ts-stack/ditsmod';

@Module({
  imports: [],
  exports: [],
  controllers: [],
  providersPerApp: [],
  providersPerMod: [],
  providersPerReq: [],
})
export class HelloWorldModule {}
```

Властивості `imports` та `exports` також приймають класи модулів, як і у кореневого модуля. І так само - усі сервіси,
що імпортуються у певний модуль, стають доступним лише для цього модуля. А ось експорт вже відрізняється, бо усі сервіси, що експортує певний модуль,
стають доступними лише для тих модулів, що будуть його імпортувати.



###

## API

### Клас AppFactory

```ts
bootstrap(appModule: ModuleType): Promise<{ server: Server; log: Logger }>;
```

Під час роботи методу `bootstrap()`:
1. відбувається читання конфігурації із метаданих, закріплених за різними декораторами затосунку (`RootModule()`, `Module()`, `Controller()`, `Route()` і т.д.);
2. відбувається валідація та злиття даної конфігурації із початковими (default) значеннями застосунку;
3. враховуючи модульність та ієрархію вказану у конфігурації, готуються інжектори з різними наборами сервісів;

### Зауваження
- Сервіс, оголошений на рівні застосунку, не повинен запитувати у своїх конструкторах сервіс,
оголошений на нижчому рівні (модуля чи запиту), оскільки він створюються один раз - при ініціалізації застосунку. Аналогічно сервіс, оголошений на рівні модуля не повинен запитувати у своєму конструкторі сервіс, оглошений на рівні запиту.
- Щоб оголосити сервіси у глобальному просторі на будь-якому рівні (на рівні застосунку, модуля чи запиту),
спочатку потрібно:
  - або оголосити сервіс у кореневому модулі на потрібному рівні
  - або імпортувати модуль із потрібним сервісом у кореневий модуль
Після чого необхідно еспортувати ці сервіси, або модулі із цими сервісами.


[1]: https://github.com/ts-stack/di
[2]: https://github.com/ts-stack/ditsmod-seed
[3]: https://github.com/ts-stack/ditsmod
[4]: https://github.com/ts-stack/ditsmod/tree/master/examples
[6]: https://github.com/nestjsx/nest-router
[8]: https://uk.wikipedia.org/wiki/%D0%92%D0%BF%D1%80%D0%BE%D0%B2%D0%B0%D0%B4%D0%B6%D0%B5%D0%BD%D0%BD%D1%8F_%D0%B7%D0%B0%D0%BB%D0%B5%D0%B6%D0%BD%D0%BE%D1%81%D1%82%D0%B5%D0%B9
[9]: https://github.com/angular/angular
[10]: https://jestjs.io/en/
[11]: https://github.com/ts-stack/di
[12]: https://uk.wikipedia.org/wiki/%D0%9E%D0%B4%D0%B8%D0%BD%D0%B0%D0%BA_(%D1%88%D0%B0%D0%B1%D0%BB%D0%BE%D0%BD_%D0%BF%D1%80%D0%BE%D1%94%D0%BA%D1%82%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F) "Singleton"