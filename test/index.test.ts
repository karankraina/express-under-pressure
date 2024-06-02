import { test } from 'tap';
import express from 'express';
import request from 'supertest';
import { underPressure } from '../src/index';

// test('middleware should allow requests when system is not under pressure', async (t) => {
//   const app = express();
//   underPressure(app);
//   app.get('/', (req, res) => res.send('ok'));

//   const response = await request(app).get('/');
//   t.equal(response.status, 200);
//   t.equal(response.text, 'ok');
// });

test('middleware should block requests when heap usage is high', async (t) => {
  const app = express();
  underPressure(app, { maxHeapUsedBytes: 10 });
  app.get('/', (req, res) => res.send('ok'));

  const response = await request(app).get('/');

  t.equal(response.status, 503);
  t.equal(response.text, 'Service Unavailable');
  t.equal(response.headers['retry-after'], '10');
});

test('middleware should block requests when RSS usage is high', async (t) => {
  const app = express();
  underPressure(app, { maxRssBytes: 10 });
  app.get('/', (req, res) => res.send('ok'));

  const response = await request(app).get('/');
  t.equal(response.status, 503);
  t.equal(response.text, 'Service Unavailable');
  t.equal(response.headers['retry-after'], '10');
});

test('middleware should return custom response message (if passed)', async (t) => {
  const app = express();
  const message = 'Custom Message';
  underPressure(app, { maxHeapUsedBytes: 10, message });
  app.get('/', (req, res) => res.send('ok'));

  const response = await request(app).get('/');
  t.equal(response.status, 503);
  t.equal(response.text, message);
  t.equal(response.headers['retry-after'], '10');
});

test('middleware should return proper retry-after header (if passed)', async (t) => {
  const app = express();

  underPressure(app, { maxHeapUsedBytes: 10, retryAfter: 20 });
  app.get('/', (req, res) => res.send('ok'));

  const response = await request(app).get('/');
  t.equal(response.status, 503);
  t.equal(response.text, 'Service Unavailable');
  t.equal(response.headers['retry-after'], '20');
});
