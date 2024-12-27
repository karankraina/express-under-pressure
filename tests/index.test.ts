import { test, TestContext } from 'node:test';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { promisify } from 'util';

import { underPressure, pressureReason, pressureType } from '../src/index';

const wait = promisify(setTimeout);

test('middleware should allow requests when system is not under pressure', async (t) => {
  const app = express();
  underPressure(app);
  app.get('/', (req, res) => res.send('ok'));

  const response = await request(app).get('/');
  t.assert.deepEqual(response.status, 200);
  t.assert.deepEqual(response.text, 'ok');
});

test('middleware should block requests when heap usage is high', async (t) => {
  const app = express();
  underPressure(app, { maxHeapUsedBytes: 10 });
  app.get('/', (req, res) => res.send('ok'));

  const response = await request(app).get('/');

  t.assert.deepEqual(response.status, 503);
  t.assert.deepEqual(response.text, 'Service Unavailable');
  t.assert.deepEqual(response.headers['retry-after'], '10');
});

test('middleware should block requests when RSS usage is high', async (t) => {
  const app = express();
  underPressure(app, { maxRssBytes: 10 });
  app.get('/', (req, res) => res.send('ok'));

  const response = await request(app).get('/');
  t.assert.deepEqual(response.status, 503);
  t.assert.deepEqual(response.text, 'Service Unavailable');
  t.assert.deepEqual(response.headers['retry-after'], '10');
});

test('middleware should return custom response message (if passed)', async (t) => {
  const app = express();
  const message = 'Custom Message';
  underPressure(app, { maxHeapUsedBytes: 10, message });
  app.get('/', (req, res) => res.send('ok'));

  const response = await request(app).get('/');
  t.assert.deepEqual(response.status, 503);
  t.assert.deepEqual(response.text, message);
  t.assert.deepEqual(response.headers['retry-after'], '10');
});

test('middleware should return proper retry-after header (if passed)', async (t) => {
  const app = express();

  underPressure(app, { maxHeapUsedBytes: 10, retryAfter: 20 });
  app.get('/', (req, res) => res.send('ok'));

  const response = await request(app).get('/');
  t.assert.deepEqual(response.status, 503);
  t.assert.deepEqual(response.text, 'Service Unavailable');
  t.assert.deepEqual(response.headers['retry-after'], '20');
});

test('middleware should execute custom pressure handler', async (t: TestContext) => {
  const app = express();

  const STATUS = 500;
  const MESSAGE = 'MESSAGE';

  underPressure(app, {
    maxHeapUsedBytes: 10,
    pressureHandler: (request: Request, response: Response) => {
      t.assert.ok(
        (response.locals as Record<string | symbol, unknown>)[pressureReason],
      );
      t.assert.ok(
        (response.locals as Record<string | symbol, unknown>)[pressureType],
      );
      response.setHeader('Retry-After', '10');
      response.status(STATUS).send(MESSAGE);
      return true;
    },
  });

  app.get('/', (req, res) => res.send('ok'));

  const response = await request(app).get('/');

  t.assert.deepEqual(response.status, STATUS);
  t.assert.deepEqual(response.text, MESSAGE);
  t.assert.deepEqual(response.headers['retry-after'], '10');
});

test('middleware should throw if custom pressure handler is not function', async (t) => {
  const app = express();

  const ERROR_MESSAGE =
    "Invalid option! 'pressureHandler' must be of type function";

  try {
    underPressure(app, {
      maxHeapUsedBytes: 10,
      pressureHandler: 'not_function' as unknown as () => void,
    });

    app.get('/', (req, res) => res.send('ok'));

    request(app).get('/');
  } catch (error) {
    t.assert.deepEqual(error.message, ERROR_MESSAGE);
  }
});

test('middleware should override retry-after if custom pressure handler is passed', async (t) => {
  const app = express();

  const STATUS = 500;
  const MESSAGE = 'MESSAGE';

  underPressure(app, {
    maxHeapUsedBytes: 10,
    retryAfter: 20,
    pressureHandler: (request: Request, response: Response) => {
      response.setHeader('Retry-After', '40');
      response.status(STATUS).send(MESSAGE);
    },
  });

  app.get('/', (req, res) => res.send('ok'));

  const response = await request(app).get('/');

  t.assert.deepEqual(response.status, STATUS);
  t.assert.deepEqual(response.text, MESSAGE);
  t.assert.deepEqual(response.headers['retry-after'], '40');
});

test('working with event Loop delay', async (t) => {
  const app = express();

  underPressure(app, {
    maxEventLoopDelay: 0.3,
    retryAfter: 20,
    sampleInterval: 10,
  });

  app.get('/', (request, response) => response.send('ok'));

  await wait(500);

  const response = await request(app).get('/');
  t.assert.deepEqual(response.status, 503);
  t.assert.deepEqual(response.text, 'Service Unavailable');
  t.assert.deepEqual(response.headers['retry-after'], '20');
});

test('isUnderPressure should be made available to app.locals', async (t: TestContext) => {
  const app = express();

  underPressure(app, {
    maxEventLoopDelay: 0.01,
    maxHeapUsedBytes: 100,
    retryAfter: 20,
  });

  app.get('/', (request, response) => {
    t.assert.ok(response.locals.isUnderPressure);
    t.assert.deepEqual(typeof response.locals.isUnderPressure, 'function');
    response.end();
  });

  await request(app).get('/');
});
