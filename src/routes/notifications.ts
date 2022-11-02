import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../types';
import {
    getConversationEvents,
    markAllRead,
    markAsRead,
    processEvents } from '../notices';
import _ from 'lodash';
import { logger } from '../logger';

const getUserFromRequest = (req: Request): User => {
    const token = `${req?.headers?.authorization}`.replace('Bearer ', '');
    logger.debug(`Header ${req?.headers?.authorization}`);
    logger.debug(`Token ${token}`);
    if (!token) {
        throw new Error('Missing Token');
    }

    try {
        return _.pick(
            jwt.verify(
                token,
                process.env.JWT_SECRET,
            ),
            [
                'name',
                'vonage_user_id',
                'vonage_member_id',
            ],
        ) as User;
    } catch (error) {
        logger.error(`Invalid token ${token}`);
        throw new Error('Invalid token');
    }
};

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const user = getUserFromRequest(req);
        const notifications = await getConversationEvents(
            process.env.VONAGE_CONVERSATION_ID,
        )
            .then(_.partial(processEvents, user));
        res.json(notifications);
    } catch (error) {
        res.status(401);
        res.json({
            'type': 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401',
            'title': 'Unauthorized',
            'detail': 'Invalid user or password',
        });
    }
};

export const markRead = async (req: Request, res: Response) => {
    try {
        const user = getUserFromRequest(req);
        const { event_id: eventId } = req.body;
        if (eventId === '__all') {
            await markAllRead(user);
        } else {
            await markAsRead(eventId, user);
        }

        res.json({
            ok: true,
        });
    } catch (error) {
        res.status(401);
        res.json({
            'type': 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401',
            'title': 'Unauthorized',
            'detail': 'Invalid user or password',
        });
    }
};
