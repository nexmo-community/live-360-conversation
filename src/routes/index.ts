import express, { Request, Response } from 'express';

export const register = (app: express.Application) => {
    app.get('/', (req: Request, res: Response) => {
        res.render('main');
    });
};
