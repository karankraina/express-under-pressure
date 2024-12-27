import type { Request, Response, NextFunction, Express } from 'express';
import { performance, monitorEventLoopDelay } from 'node:perf_hooks';
import assert from 'node:assert';

const { eventLoopUtilization } = performance;

const SERVICE_UNAVAILABLE = 503;

export const pressureReason = Symbol('pressureReason');
export const pressureType = Symbol('pressureType');

export const TYPE_EVENT_LOOP_DELAY = 'eventLoopDelay';
export const TYPE_HEAP_USED_BYTES = 'heapUsedBytes';
export const TYPE_RSS_BYTES = 'rssBytes';
// const TYPE_HEALTH_CHECK = 'healthCheck';
export const TYPE_EVENT_LOOP_UTILIZATION = 'eventLoopUtilization';

interface MiddlewareOptions {
  disableCheck?: boolean;
  maxEventLoopDelay?: number;
  maxEventLoopUtilization?: number;
  maxHeapUsedBytes?: number;
  maxRssBytes?: number;
  retryAfter?: number;
  message?: string;
  sampleInterval?: number;
  pressureHandler?: (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => unknown;
}

export function underPressure(
  app: Express,
  opts: MiddlewareOptions = {},
): void {
  const resolution = 10;
  const disableCheck = opts.disableCheck || false;
  const sampleInterval = opts.sampleInterval || 1000;
  const maxEventLoopDelay = opts.maxEventLoopDelay || 0;
  const maxHeapUsedBytes = opts.maxHeapUsedBytes || 0;
  const maxRssBytes = opts.maxRssBytes || 0;
  const maxEventLoopUtilization = opts.maxEventLoopUtilization || 0;
  const message = opts.message || 'Service Unavailable';

  const checkMaxEventLoopDelay = maxEventLoopDelay > 0;
  const checkMaxHeapUsedBytes = maxHeapUsedBytes > 0;
  const checkMaxRssBytes = maxRssBytes > 0;
  const checkMaxEventLoopUtilization = maxEventLoopUtilization > 0;
  const pressureHandler = opts.pressureHandler || null;

  if (disableCheck) {
    return;
  }

  if (
    checkMaxEventLoopUtilization === false &&
    checkMaxEventLoopDelay === false &&
    checkMaxHeapUsedBytes === false &&
    checkMaxRssBytes === false
  ) {
    return;
  }

  if (pressureHandler) {
    assert(
      typeof pressureHandler === 'function',
      "Invalid option! 'pressureHandler' must be of type function",
    );
  }

  let heapUsed = 0;
  let rssBytes = 0;
  let eventLoopDelay = 0;

  let eventLoopUtilized = 0;

  const histogram = monitorEventLoopDelay({ resolution });
  histogram.enable();

  const elu = eventLoopUtilization();

  const timer = setTimeout(beginMemoryUsageUpdate, sampleInterval);
  timer.unref();
  beginMemoryUsageUpdate();

  const retryAfter = opts.retryAfter || 10;

  function isUnderPressure() {
    if (checkMaxEventLoopDelay && eventLoopDelay > maxEventLoopDelay) {
      return true;
    }

    if (checkMaxHeapUsedBytes && heapUsed > maxHeapUsedBytes) {
      return true;
    }

    if (checkMaxRssBytes && rssBytes > maxRssBytes) {
      return true;
    }

    return (
      checkMaxEventLoopUtilization &&
      eventLoopUtilized > maxEventLoopUtilization
    );
  }

  function updateEventLoopDelay() {
    eventLoopDelay = Math.max(0, histogram.mean / 1e6 - resolution);

    if (Number.isNaN(eventLoopDelay)) eventLoopDelay = Infinity;
    histogram.reset();
  }

  function updateEventLoopUtilization() {
    eventLoopUtilized = eventLoopUtilization(elu).utilization;
  }

  function beginMemoryUsageUpdate() {
    updateMemoryUsage();
    timer.refresh();
  }

  function updateMemoryUsage() {
    const mem = process.memoryUsage();
    heapUsed = mem.heapUsed;
    rssBytes = mem.rss;
    updateEventLoopDelay();
    updateEventLoopUtilization();
  }

  function handlePressure(
    request: Request,
    response: Response,
    next: NextFunction,
  ) {
    if (pressureHandler) {
      pressureHandler(request, response, next);
    } else {
      response.setHeader('Retry-After', retryAfter);
      response.status(SERVICE_UNAVAILABLE).send(message);
    }
  }

  function underPressureHandler(
    request: Request,
    response: Response,
    next: NextFunction,
  ) {
    if (checkMaxEventLoopDelay && eventLoopDelay > maxEventLoopDelay) {
      const reason = `[Event Loop Delay]: Max Allowed: ${maxEventLoopDelay}, current: ${eventLoopDelay} `;
      (response.locals as Record<string | symbol, unknown>)[pressureReason] =
        reason;
      (response.locals as Record<string | symbol, unknown>)[pressureType] =
        TYPE_EVENT_LOOP_DELAY;
      return handlePressure(request, response, next);
    }

    if (checkMaxHeapUsedBytes && heapUsed > maxHeapUsedBytes) {
      const reason = `[Max Heap Used Bytes]: Max Allowed: ${maxHeapUsedBytes}, current: ${heapUsed} `;
      (response.locals as Record<string | symbol, unknown>)[pressureReason] =
        reason;
      (response.locals as Record<string | symbol, unknown>)[pressureType] =
        TYPE_HEAP_USED_BYTES;
      return handlePressure(request, response, next);
    }

    if (checkMaxRssBytes && rssBytes > maxRssBytes) {
      const reason = `[Max RSS Bytes]: Max Allowed: ${maxRssBytes}, current: ${rssBytes} `;
      (response.locals as Record<string | symbol, unknown>)[pressureReason] =
        reason;
      (response.locals as Record<string | symbol, unknown>)[pressureType] =
        TYPE_RSS_BYTES;
      return handlePressure(request, response, next);
    }

    if (
      checkMaxEventLoopUtilization &&
      eventLoopUtilized > maxEventLoopUtilization
    ) {
      const reason = `[Max Event Loop Utilization]: Max Allowed: ${maxEventLoopUtilization}, current: ${eventLoopUtilized} `;
      (response.locals as Record<string | symbol, unknown>)[pressureReason] =
        reason;
      (response.locals as Record<string | symbol, unknown>)[pressureType] =
        TYPE_EVENT_LOOP_UTILIZATION;
      return handlePressure(request, response, next);
    }

    response.locals.isUnderPressure = isUnderPressure;
    next();
  }

  app.use(underPressureHandler);
}
