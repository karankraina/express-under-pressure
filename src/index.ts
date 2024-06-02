import type { Request, Response, NextFunction, Express } from 'express';
import { performance, monitorEventLoopDelay } from 'node:perf_hooks';

const { eventLoopUtilization } = performance;

const SERVICE_UNAVAILABLE = 503;

// const TYPE_EVENT_LOOP_DELAY = 'eventLoopDelay';
// const TYPE_HEAP_USED_BYTES = 'heapUsedBytes';
// const TYPE_RSS_BYTES = 'rssBytes';
// const TYPE_HEALTH_CHECK = 'healthCheck';
// const TYPE_EVENT_LOOP_UTILIZATION = 'eventLoopUtilization';

interface MiddlewareOptions {
  maxEventLoopDelay?: number;
  maxEventLoopUtilization?: number;
  maxHeapUsedBytes?: number;
  maxRssBytes?: number;
  retryAfter?: number;
  message?: string;
}

export function underPressure(
  app: Express,
  opts: MiddlewareOptions = {},
): void {
  const resolution = 10;
  const sampleInterval = 1000;
  const maxEventLoopDelay = opts.maxEventLoopDelay || 0;
  const maxHeapUsedBytes = opts.maxHeapUsedBytes || 0;
  const maxRssBytes = opts.maxRssBytes || 0;
  const maxEventLoopUtilization = opts.maxEventLoopUtilization || 0;
  const message = opts.message || 'Service Unavailable';

  const checkMaxEventLoopDelay = maxEventLoopDelay > 0;
  const checkMaxHeapUsedBytes = maxHeapUsedBytes > 0;
  const checkMaxRssBytes = maxRssBytes > 0;
  const checkMaxEventLoopUtilization = maxEventLoopUtilization > 0;

  console.log({
    checkMaxEventLoopDelay,
    checkMaxEventLoopUtilization,
    checkMaxHeapUsedBytes,
    checkMaxRssBytes,
  });

  if (
    checkMaxEventLoopUtilization === false &&
    checkMaxEventLoopDelay === false &&
    checkMaxHeapUsedBytes === false &&
    checkMaxRssBytes === false
  ) {
    return;
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

  function updateEventLoopDelay() {
    eventLoopDelay = Math.max(0, histogram.mean / 1e6 - resolution);
    if (Number.isNaN(eventLoopDelay)) eventLoopDelay = Infinity;
    histogram.reset();
  }

  function updateEventLoopUtilization() {
    if (elu) {
      eventLoopUtilized = eventLoopUtilization(elu).utilization;
    } else {
      eventLoopUtilized = 0;
    }
  }

  function beginMemoryUsageUpdate() {
    updateMemoryUsage();
    timer.refresh();
  }

  function updateMemoryUsage() {
    const mem = process.memoryUsage();
    console.log('updating heap used: ', mem.heapUsed);
    heapUsed = mem.heapUsed;
    rssBytes = mem.rss;
    updateEventLoopDelay();
    updateEventLoopUtilization();
  }

  function handlePressure(request: Request, response: Response) {
    response.setHeader('Retry-After', retryAfter);
    console.log({ message });
    response.status(SERVICE_UNAVAILABLE).send(message);
  }

  function underPressureHandler(
    request: Request,
    response: Response,
    next: NextFunction,
  ) {
    console.log({ heapUsed });
    // TODO: Pass info about what resource caused this pressure.
    if (checkMaxEventLoopDelay && eventLoopDelay > maxEventLoopDelay) {
      return handlePressure(request, response);
    }

    if (checkMaxHeapUsedBytes && heapUsed > maxHeapUsedBytes) {
      return handlePressure(request, response);
    }

    if (checkMaxRssBytes && rssBytes > maxRssBytes) {
      return handlePressure(request, response);
    }

    if (
      checkMaxEventLoopUtilization &&
      eventLoopUtilized > maxEventLoopUtilization
    ) {
      return handlePressure(request, response);
    }

    next();
  }

  app.use(underPressureHandler);
}
