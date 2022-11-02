import express, { Request, Response } from 'express';
import { loginRoute } from './login';
import { getNotifications, markRead } from './notifications';

export const register = (app: express.Application) => {
    app.get('/', (req: Request, res: Response) => {
        res.render('main');
    });

    app.post('/login', loginRoute);

    app.get('/notifications', getNotifications);

    app.post('/notifications', markRead);
};
