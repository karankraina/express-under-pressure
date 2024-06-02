import { test } from 'tap';
import express from 'express';
import request from 'supertest';
import { underPressure } from '../src/index';

test('middleware should allow requests when system is not under pressure', async (t) => {
  const app = express();
  app.use(underPressure());
  app.get('/', (req, res) => res.send('ok'));

  const response = await request(app).get('/');
  t.equal(response.status, 200);
  t.equal(response.text, 'ok');
});

test('middleware should block requests when heap usage is high', async (t) => {
  const app = express();
  app.use(underPressure({ maxHeapUsedBytes: 0 }));
  app.get('/', (req, res) => res.send('ok'));

  const response = await request(app).get('/');
  t.equal(response.status, 503);
  t.equal(response.text, 'Server Under Pressure');
});

test('middleware should block requests when RSS usage is high', async (t) => {
  const app = express();
  app.use(underPressure({ maxRssBytes: 0 }));
  app.get('/', (req, res) => res.send('ok'));

  const response = await request(app).get('/');
  t.equal(response.status, 503);
  t.equal(response.text, 'Server Under Pressure');
});

test('middleware should return custom response message (is passed) and circuit is open', async (t) => {
  const app = express();
  app.use(underPressure({ maxHeapUsedBytes: 0, message: 'Custom Message' }));
  app.get('/', (req, res) => res.send('ok'));

  const response = await request(app).get('/');
  t.equal(response.status, 503);
  t.equal(response.text, 'Custom Message');
});
