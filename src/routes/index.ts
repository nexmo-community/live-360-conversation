import express, { Request, Response } from 'express';
import { logger } from '../logger';
import { loginRoute } from './login';
import { getNotifications, markRead } from './notifications';

export const register = (app: express.Application) => {
    app.get('/', (req: Request, res: Response) => {
        res.render('main');
    });

    app.post('/login', loginRoute);

    app.get('/notifications', getNotifications);

    app.post('/notifications', markRead);

    app.get('/events', (req: Request, res: Response) => {
        logger.debug('Webhook', req.body);
    });
};
