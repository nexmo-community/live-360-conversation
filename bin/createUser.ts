#!/usr/bin/env ts-node
import yargs from 'yargs';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import _ from 'lodash';
import { vonage } from '../src/vonage';
import { logger } from '../src/logger';
import dotenv from 'dotenv';
import { Conversation, User, Member, USER_FILE } from '../src/types';

dotenv.config();
const createVonageUser = (
    name: string,
): Promise<Conversation> => new Promise((resolve, reject) => {
    logger.debug('Creating vonage user');
    vonage.users.create(
        {
            name: _.kebabCase(name),
            display_name: name,
        },
        (err: Error, conversation: Conversation) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }

            logger.debug('Vonage user created');
            resolve(conversation);
        },
    );
});

const createVonageMembership = (
    user: User,
): Promise<Member> => new Promise((resolve, reject) => {
    logger.debug('Joining conversation');
    vonage.conversations.members.create(
        process.env.VONAGE_CONVERSATION_ID,
        {
            action: 'join',
            user_id: user.vonage_user_id,
            channel: {
                type: 'app',
            },
        },
        (err: Error, member: Member) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }

            logger.debug('Conversation joined');
            resolve(member);
        },
    );
});
yargs.scriptName('create-user')
    .usage('$0 <cmd> [args]')
    .command(
        'create [name] [pass]',
        'Create a test user',
        (yargs: any): void => {
            yargs.positional('name', {
                type: 'string',
                describe: 'User name',
            });
            yargs.positional('pass', {
                type: 'string',
                describe: 'Password for the user',
            });
        },
        async ({ name, pass }) => {
            // create the local user
            const users = existsSync(USER_FILE)
                ? new Set(JSON.parse(
                    readFileSync(USER_FILE).toString() as string,
                ))
                : new Set() as Set<User>;

            const foundUser = _.find(
                [...users],
                { name: name },
            ) as unknown as User;
            logger.debug(foundUser
                ? `Found existing user with ${name}`
                : 'No user found',
            );
            const user = !foundUser
                ? {
                    name: name,
                    pass: pass,
                    vonage_user_id: '',
                    vonage_member_id: '',
                }
                : foundUser;

            // create the vonage user
            try {
                const { id } = !foundUser?.vonage_user_id
                    ? await createVonageUser(name as string)
                    : { id: foundUser.vonage_user_id };
                user.vonage_user_id = id;
            } catch (error: unknown) {
                logger.error('There was an error creating the voange user');
                logger.error(error);
            }

            // Create memembershp
            try {
                const { id } = !foundUser?.vonage_member_id
                    ? await createVonageMembership(user as User)
                    : { id: foundUser.vonage_member_id };

                user.vonage_member_id = id;
            } catch (error: unknown) {
                logger.error('There was an error joining the conversation');
                logger.error(error);
            }

            users.add(user);

            // Save user
            writeFileSync(USER_FILE, JSON.stringify([...users], null, 2));
            logger.info(`User ${name} created`);
        })
    .demandOption(['name', 'pass'])
    .help()
    .argv;

