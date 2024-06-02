"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tap_1 = require("tap");
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../src/index");
(0, tap_1.test)('middleware should allow requests when system is not under pressure', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const app = (0, express_1.default)();
    app.use((0, index_1.underPressure)());
    app.get('/', (req, res) => res.send('ok'));
    const response = yield (0, supertest_1.default)(app).get('/');
    t.equal(response.status, 200);
    t.equal(response.text, 'ok');
}));
// test('middleware should block requests when heap usage is high', async (t) => {
//   const app = express();
//   app.use(underPressure({ maxHeapUsedBytes: 0 }));
//   app.get('/', (req, res) => res.send('ok'));
//   const response = await request(app).get('/');
//   t.equal(response.status, 503);
//   t.equal(response.text, 'Server under pressure');
// });
// test('middleware should block requests when RSS usage is high', async (t) => {
//   const app = express();
//   app.use(underPressure({ maxRssBytes: 0 }));
//   app.get('/', (req, res) => res.send('ok'));
//   const response = await request(app).get('/');
//   t.equal(response.status, 503);
//   t.equal(response.text, 'Server under pressure');
// });
