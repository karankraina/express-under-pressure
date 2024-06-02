import type { Request, Response, NextFunction } from "express";

interface MiddlewareOptions {
    maxEventLoopDelay?: number;
    maxHeapUsedBytes?: number;
    maxRssBytes?: number;
    message?: string;
}

type UnderPressureMiddleware = (request: Request, response: Response, next: NextFunction) => unknown;

const defaultOptions = {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 200 * 1024 * 1024,
    maxRssBytes: 300 * 1024 * 1024,
    message: 'Server Under Pressure',
}

function checkEventLoopDelay(maxDelay: number): Boolean {
    const start = process.hrtime();
    setTimeout(() => {
        const delta = process.hrtime(start);
        const delay = delta[0] * 1e3 + delta[1] / 1e6;
        return delay > maxDelay;
    }, 0);
    return false;
}

export function underPressure(opts: MiddlewareOptions = {}): UnderPressureMiddleware {

    const options = Object.assign({}, defaultOptions, opts);

    return function underPressureHandler(request, response, next) {
        console.log('Under Pressure working...');
        const {heapUsed, rss} = process.memoryUsage();

        const isEventLoopDelayed = checkEventLoopDelay(options.maxEventLoopDelay);

        if (heapUsed > options.maxHeapUsedBytes || rss > options.maxRssBytes || isEventLoopDelayed) {
            response.status(503).send(options.message);
        } else {
            next();
        }
    }
}
