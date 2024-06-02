"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.underPressure = void 0;
const defaultOptions = {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 200 * 1024 * 1024,
    maxRssBytes: 300 * 1024 * 1024,
    message: 'Server Under Pressure',
};
function checkEventLoopDelay(maxDelay) {
    const start = process.hrtime();
    setTimeout(() => {
        const delta = process.hrtime(start);
        const delay = delta[0] * 1e3 + delta[1] / 1e6;
        return delay > maxDelay;
    }, 0);
    return false;
}
function underPressure(opts = {}) {
    const options = Object.assign({}, opts, defaultOptions);
    return function underPressureHandler(request, response, next) {
        console.log('Under Pressure working...');
        const { heapUsed, rss } = process.memoryUsage();
        const isEventLoopDelayed = checkEventLoopDelay(options.maxEventLoopDelay);
        console.log({ heapUsed });
        if (heapUsed > options.maxHeapUsedBytes || rss > options.maxRssBytes || isEventLoopDelayed) {
            response.status(503).send(options.message);
        }
        else {
            next();
        }
    };
}
exports.underPressure = underPressure;
