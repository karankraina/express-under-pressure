# ExpressJS Under Pressure Middleware

This TypeScript package provides an ExpressJS middleware to monitor your server's health and automatically respond with a "Server Under Pressure" message when certain thresholds are exceeded. This is useful for maintaining server stability under heavy load.

## Features

- Monitors event loop delay
- Monitors heap memory usage
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

Here's a detailed example of how to use the `underPressure` middleware in an Express application.

### Importing the Middleware

First, import the necessary modules in your TypeScript file:

```typescript
import express from 'express';
import { underPressure } from 'express-under-pressure';
```

### Creating the Middleware

Next, create an instance of the middleware with your desired options:

```typescript
const underPressureMiddleware = underPressure({
  maxEventLoopDelay: 1000, // Maximum event loop delay in milliseconds
  maxHeapUsedBytes: 200 * 1024 * 1024, // Maximum heap used in bytes
  maxRssBytes: 300 * 1024 * 1024, // Maximum RSS memory used in bytes
  message: 'Server Under Pressure', // Custom response message
});
```

### Applying the Middleware

Finally, apply the middleware to your Express application:

```typescript
const app = express();

// Apply the underPressure middleware
app.use(underPressureMiddleware);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

### Full Example

Here is a complete example:

```typescript
import express from 'express';
import { underPressure } from 'express-under-pressure';

const app = express();

const underPressureMiddleware = underPressure({
  maxEventLoopDelay: 1000, // Maximum event loop delay in milliseconds
  maxHeapUsedBytes: 200 * 1024 * 1024, // Maximum heap used in bytes
  maxRssBytes: 300 * 1024 * 1024, // Maximum RSS memory used in bytes
  message: 'Server Under Pressure', // Custom response message
});

app.use(underPressureMiddleware);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

## Middleware Options

The `underPressure` middleware accepts an options object with the following properties:

- `maxEventLoopDelay` (number): The maximum event loop delay in milliseconds. Default is `1000` ms.
- `maxHeapUsedBytes` (number): The maximum heap memory usage in bytes. Default is `200 * 1024 * 1024` bytes (200 MB).
- `maxRssBytes` (number): The maximum RSS memory usage in bytes. Default is `300 * 1024 * 1024` bytes (300 MB).
- `message` (string): The message to send when the server is under pressure. Default is `'Server Under Pressure'`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Feel free to reach out if you have any questions or need further assistance.

Happy coding!

