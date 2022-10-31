import express, { Express } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import expressLayouts from 'express-ejs-layouts';
import { register } from './routes/index.js';
import livereload from 'livereload';
import connectLiveReload from 'connect-livereload';

dotenv.config();


const liveReloadServer = livereload.createServer();
liveReloadServer.server.once('connection', () => {
    setTimeout(() => {
        console.debug('Refreshing page');
        liveReloadServer.refresh('/');
    }, 100);
});

const app: Express = express();
const port: number = parseInt(process.env.PORT ?? '8080');

// Set up logger
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
