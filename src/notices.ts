import { logger } from './logger';
import _ from 'lodash';
import { vonage } from './vonage';
import {
    VonageEvent,
    DeletedEventBody,
    CustomReadBody,
    NotificationBody,
    User,
    Notification,
} from './types';

export const getConversationEvents = (converstionId: string) =>
    new Promise((resolve: any, reject: any) => {
        logger.info(`Fetching events for ${converstionId}`);
        vonage.conversations.events.get(
            converstionId,
            {
                // eslint-disable-next-line max-len
                event_type: 'custom:notice,event:delete,custom:read,custom:read-all',
                page_size: 100,
            },
            (error: Error, result: any) => {
                if (error) {
                    reject(error);
                    return;
                }

                const events = _.get(result, '_embedded.data.events', []);
                console.info('Got events', events);
                resolve(events);
            },
        );
    });

const processEvent = (
    user: User,
    acc: any,
    event: VonageEvent,
): any => {
    logger.debug('Processing event', event);
    const { id, body, timestamp, from } = event;
    const {
        message,
        priority,
        image,
        icon,
        event_id: eventId,
    } = body as NotificationBody & CustomReadBody & DeletedEventBody;
    switch (event.type) {
        case 'event:delete':
            logger.debug('Event deleted');
            return _.omit(acc, [id]);

        case 'custom:notice':
            logger.debug('Notification');
            return _.set(
                acc,
                id,
                {
                    notification_id: id,
                    read: false,
                    message: message,
                    priority: priority ?? null,
                    image: image ?? null,
                    icon: icon ?? null,
                    timestamp: timestamp,
                },
            );

        case 'custom:read':
            logger.debug(`Notification read ${eventId}`);
            return _.has(acc, eventId) && from === user.vonage_user_id
                ? _.set(acc, `${eventId}.read`, true)
                : acc;

        case 'custom:read-all':
            logger.debug('Read all notifications');
            return from !== user.vonage_user_id
                ? _.reduce(
                    acc,
                    (notices, notification, index) => _.set(
                        notices,
                        `${index}.read`,
                        true,
                    ),
                    acc,
                )
                : acc;

        default:
            return acc;
    }
};

export const processEvents = (
    user: User,
    events: Array<VonageEvent>,
): Array<Notification> => {
    logger.debug('Processing events', events);

    return _.sortBy(
        _.values(_.reduce(
            events,
            _.partial(processEvent, user),
            {},
        )),
        ['priority', 'timestamp'],
    );
};

const createEvent = (
    event: any,
): Promise<VonageEvent> => new Promise((resolve, reject) => {
    vonage.conversations.event.create(
        event,
        (err: any, result: any) => {
            if (err) {
                reject(err);
                return;
            }
            result(result);
        },
    );
});

export const markAsRead = async (
    notificationId: string,
    user: User,
): Promise<boolean> => {
    try {
        await createEvent({
            type: 'custom:read',
            from: user.vonage_user_id,
            body: {
                event_id: notificationId,
            },
        });
        return true;
    } catch (error) {
        return false;
    }
};

export const markAllRead = async (
    user: User,
): Promise<boolean> => {
    try {
        await createEvent({
            type: 'custom:read-all',
            from: user.vonage_user_id,
            body: {
            },
        });
        return true;
    } catch (error) {
        return false;
    }
};
