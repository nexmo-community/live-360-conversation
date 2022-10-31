import express, { Request, Response } from 'express';
import { getConversations } from '../notices.js';

export const register = (app: express.Application) => {
    app.get('/', (req: Request, res: Response) => {
        getConversations();
        res.render('main');
    });
};
