import express, { Request, Response } from 'express';
import { loginRoute } from './login';

export const register = (app: express.Application) => {
    app.get('/', (req: Request, res: Response) => {
        res.render('main');
    });

    app.post('/login', loginRoute);
};
