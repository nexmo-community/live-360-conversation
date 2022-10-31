import Vonage from '@vonage/server-sdk';
import dotenv from 'dotenv';
import { logger } from './logger';
import _ from 'lodash';
import { access } from 'fs';

dotenv.config();

interface VonageEvent {
    id: number,
    type: string,
    timestamp: string,
    body: DeletedEventBody | CustomReadBody | NotificationBody,
}

interface DeletedEventBody {
    event_id: number
}

interface Notification {
    notificat_id: number,
    message: string,
    read: boolean,
    priority: number
    image: string,
    icon: string
}

type CustomReadBody = DeletedEventBody;

type NotificationBody = Notification

const vonage = new Vonage(
    {
        apiKey: process.env.VONAGE_API_KEY,
        apiSecret: process.env.VONAGE_API_SECRET,
        applicationId: process.env.VONAGE_APP_ID,
        privateKey: `${__dirname}/../data/private.key`,
    },
) as any;

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

export const processEvents = (
    events: Array<VonageEvent>,
): Array<Notification> => {
    logger.debug('Processing events', events);

    return _.sortBy(
        _.values(_.reduce(
            events,
            (
                acc,
                event: VonageEvent,
            ): any => {
                logger.debug('Processing event', event);
                const { id, body, timestamp } = event;
                const {
                    message,
                    priority,
                    image,
                    icon,
                    event_id: eventId,
                // eslint-disable-next-line max-len
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
                        return _.has(acc, eventId)
                            ? _.set(acc, `${eventId}.read`, true)
                            : acc;
                    case 'custom:read-all':
                        logger.debug('Read all notifications');
                        return _.reduce(
                            acc,
                            (notices, notification, index) => _.set(
                                notices,
                                `${index}.read`,
                                true,
                            ),
                            acc,
                        );
                    default:
                        return acc;
                }
            },
            {},
        )),
        ['priority', 'timestamp'],
    );
};


getConversationEvents(process.env.VONAGE_CONVERSATION_ID)
    .then(processEvents)
    .then((notifications) => {
        logger.debug('Processed events', notifications);
    })
    .catch(console.error);
