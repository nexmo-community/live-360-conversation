import express, { Express } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { createLogger, transports, format } from 'winston';
import expressWinston from 'express-winston';
import expressLayouts from 'express-ejs-layouts';
import { register } from './routes/index.js';
import livereload from 'livereload';
import connectLiveReload from 'connect-livereload';

dotenv.config();

const loggerConfig = {
    level: 'debug',
    transports: [new transports.Console()],
    format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level}: ${message}`;
        }),
    ),
};
const logger = createLogger(loggerConfig);

const liveReloadServer = livereload.createServer();
liveReloadServer.server.once('connection', () => {
    setTimeout(() => {
        logger.debug('Refreshing page');
        liveReloadServer.refresh('/');
    }, 100);
});

const app: Express = express();
const port: number = parseInt(process.env.PORT ?? '8080');

// Set up logger
app.use(expressWinston.logger(loggerConfig));
app.use(connectLiveReload());

// Set up views
app.use(expressLayouts);

app.set('layout', 'layouts/layout');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

register(app);

app.listen(port, () => {
    logger.info(`Server is running at https://localhost:${port}`);
});
