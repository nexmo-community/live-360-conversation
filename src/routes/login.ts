import { Request, Response } from 'express';
import { logger } from '../logger';
import { User, USER_FILE } from '../types';
import { readFileSync, existsSync } from 'fs';
import _ from 'lodash';
import jwt from 'jsonwebtoken';

export const loginRoute = (req: Request, res: Response) => {
    logger.info('Login request');
    logger.debug('Request body', req.body);
    if (!existsSync(USER_FILE)) {
        logger.error('Please create a user');
        res.status(500);
        res.json({
            'type': 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500',
            'title': 'Internal Server Error',
            'detail': 'Server is not configured for users',
        });
        return;
    }
    const { user, password } = req.body;

    const users =new Set(JSON.parse(
        readFileSync(USER_FILE).toString() as string,
    ));

    const foundUser = _.find([...users], { name: user }) as unknown as User;
    logger.debug('Users', [...users]);
    logger.debug(foundUser);
    if (!foundUser) {
        logger.warn('No user found');
        res.status(401);
        res.json({
            'type': 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401',
            'title': 'Unauthorized',
            'detail': 'Invalid user or password',
        });
        return;
    }


    if (foundUser.pass !== password) {
        logger.warn('Invalid password');
        res.status(401);
        res.json({
            'type': 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401',
            'title': 'Unauthorized',
            'detail': 'Invalid user or password',
        });
        return;
    }

    const token = jwt.sign(
        _.omit(foundUser, ['pass']),
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
    );
    res.json({
        token: token,
    });
};
