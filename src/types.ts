import path from 'path';

export const USER_FILE = path.normalize(
    path.join(__dirname, '../', 'data', 'users.json'),
);

export type User = {
    name: string,
    pass: string,
    vonage_user_id: string | null,
    vonage_member_id: string | null
}

export type Conversation = {
    id: string
}

export type Member = {
    id: string,
    user_id: string,
    name: string,
    display_name: string,
    state: string,
}

export interface VonageEvent {
    id: number,
    type: string,
    timestamp: string,
    to: string,
    from: string,
    body: DeletedEventBody | CustomReadBody | NotificationBody,
}

export interface DeletedEventBody {
    event_id: number
}

export interface Notification {
    notificat_id: number,
    message: string,
    read: boolean,
    priority: number
    image: string,
    icon: string
}

export type CustomReadBody = DeletedEventBody;

export type NotificationBody = Notification
