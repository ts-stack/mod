# Logger

Check from first terminal:

```bash
npm run start4
```

From second terminal:

```bash
curl -isS localhost:8080/bunyan
curl -isS localhost:8080/pino
curl -isS localhost:8080/winston
```

As you can see, there are examples for [winston][3], [bunyan][1] and [pino][2] loggers.
They work in one application, but in different modules.

[1]: https://github.com/trentm/node-bunyan
[2]: https://github.com/pinojs/pino
[3]: https://github.com/winstonjs/winston