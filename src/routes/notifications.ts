import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../types';
import {
    getConversationEvents,
    markAllRead,
    markAsRead,
    processEvents } from '../notices';
import _ from 'lodash';

const getUserFromRequest = (req: Request): User => {
    const token = `${req?.headers?.authorization}`.replace('Bearer ', '');
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
};

export const getNotifications = async (req: Request, res: Response) => {
    const user = getUserFromRequest(req);
    const notifications = await getConversationEvents(
        process.env.VONAGE_CONVERSATION_ID,
    )
        .then(_.partial(processEvents, user));
    res.json(notifications);
};

export const markRead = async (req: Request, res: Response) => {
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
};
