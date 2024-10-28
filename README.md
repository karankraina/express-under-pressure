# ExpressJS Under Pressure

Monitor your server's health and automatically respond with a "Server Under Pressure" message when certain thresholds are exceeded. This is useful for maintaining server stability under heavy load.

This is an Express JS alternative for [@fastify/under-pressure](https://github.com/fastify/under-pressure). I will try to add all APIs provided in the fastify plugin in this.

> **Note:** This package is heavily inspired from `@fastify/under-pressure`. Shoutout to the maintainers and collaborators of the project.

## Features

- Monitors event loop delay
- Monitors heap memory usage
- Monitors event loop utilization
- Monitors resident set size (RSS) memory usage
- Configurable thresholds for all metrics
- Customizable response message

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

app.get('/', (req, res) => {
  if (res.locals.isUnderPressure()) {
    // Avoind heavy computations here
  }
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

## Middleware Options

The `underPressure` function takes express app instance and an options object with the following properties:

- `maxEventLoopDelay` (number): The maximum event loop delay in milliseconds.
- `maxHeapUsedBytes` (number): The maximum heap memory usage in bytes.
- `maxRssBytes` (number): The maximum RSS memory usage in bytes.
- `maxEventLoopUtilization` (number): The maximum event loop utilisation.
- `message` (string): Optional. The message to send when the server is under pressure.
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
