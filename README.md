# ExpressJS Under Pressure [![Downloads](https://img.shields.io/npm/dm/express-under-pressure.svg)](https://npmjs.com/express-under-pressure) [![npm version](https://img.shields.io/npm/v/express-under-pressure.svg?style=flat)](https://www.npmjs.com/package/express-under-pressure)

<p>
    <a href="https://twitter.com/karankraina" target="_blank">
        <img alt="Twitter: karankraina" src="https://img.shields.io/twitter/follow/karankraina.svg?style=social" />
    </a>
</p>

Monitor your server's health and automatically respond with a "Server Under Pressure" message when certain thresholds are exceeded. This is useful for maintaining server stability under heavy load.

This is an Express JS alternative for [@fastify/under-pressure](https://github.com/fastify/under-pressure). Feel free to open an issue or submit a PR if find any issue.

> **Note:** This package is inspired from `@fastify/under-pressure`. Shoutout to the maintainers and collaborators of the project.

## Features

- Monitors event loop delay
- Monitors heap memory usage
- Monitors event loop utilization
- Monitors resident set size (RSS) memory usage
- Configurable thresholds for all metrics
- Customizable response message or even custom response handlers for under pressure requests.

## Installation

You can install the package using npm:

```sh
npm install express-under-pressure
```

or using yarn:

```sh
yarn add express-under-pressure
```

## Usage

Here's a detailed example of how to use the `underPressure` in an Express application.

### Import

First, import the necessary modules in your TypeScript file:

```typescript
import express from 'express';
import { underPressure } from 'express-under-pressure';
```

### Register the middleware

Next, create an instance of the middleware with your desired options:

```typescript
const app = express();

underPressure(app, {
  maxEventLoopDelay: 1000, // Maximum event loop delay in milliseconds
  maxHeapUsedBytes: 200 * 1024 * 1024, // Maximum heap used in bytes
  maxRssBytes: 300 * 1024 * 1024, // Maximum RSS memory used in bytes
  maxEventLoopUtilization: 0.98 // Maximum event loop utilisation
  message: 'Server Under Pressure', // Custom response message
});

app.get('/', (request, response) => {
  if (response.locals.isUnderPressure()) {
    // Avoind heavy computations here
  }
  response.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

You can also limit the scope of this middleware to a specific router instance.

```typescript
const router = express.Router();

underPressure(router, {
  maxEventLoopDelay: 1000, // Maximum event loop delay in milliseconds
  maxHeapUsedBytes: 200 * 1024 * 1024, // Maximum heap used in bytes
  maxRssBytes: 300 * 1024 * 1024, // Maximum RSS memory used in bytes
  maxEventLoopUtilization: 0.98 // Maximum event loop utilisation
  message: 'Server Under Pressure', // Custom response message
});

router.get('/', (request, response) => {
  if (response.locals.isUnderPressure()) {
    // Avoind heavy computations here
  }
  response.send('Hello World!');
});

```

To add a custom response handler for requests under pressure, you can pass `pressureHandler` like

```typescript

import { pressureReason, pressureType, underPressure } from 'express-under-pressure';

function pressureHandler(request, response) {
	// A detailed reason why this handler was called.
	const reason = response.locals[pressureReason];
	// Metric type that was breached.
	const type = response.locals[pressureType];

	logger.error(`Server Under Pressure - ${reason}`);

	response.setHeader('Retry-After', 10);
	response.setHeader('X-Under-Pressure-Type', type);
	response.status(503).send('Server under pressure!');

}

underPressure(router, {
	maxEventLoopDelay: 1000, // Maximum event loop delay in milliseconds
	maxHeapUsedBytes: 200 * 1024 * 1024, // Maximum heap used in bytes
	maxRssBytes: 300 * 1024 * 1024, // Maximum RSS memory used in bytes
	maxEventLoopUtilization: 0.98, // Maximum event loop utilisation
	pressureHandler,
});
```


## Middleware Options

The `underPressure` function takes express app instance and an options object with the following properties:

- `maxEventLoopDelay` (number): The maximum event loop delay in milliseconds. Disabled if set to 0 or undefined.
- `maxHeapUsedBytes` (number): The maximum heap memory usage in bytes. Disabled if set to 0 or undefined.
- `maxRssBytes` (number): The maximum RSS memory usage in bytes. Disabled if set to 0 or undefined.
- `maxEventLoopUtilization` (number): The maximum event loop utilisation. Disabled if set to 0 or undefined.
- `message` (string): Optional. The message to send when the server is under pressure.
- `pressureHandler` (function): Custom handler for under-pressure requests. If set, `message` is ignored.
- `retryAfter` (number): Optional. The value for Retry-After header..

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Feel free to reach out if you have any questions or need further assistance.

Happy coding!

```

```
