import dotenv from 'dotenv';
import Vonage from '@vonage/server-sdk';

dotenv.config();

export const config ={
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
    applicationId: process.env.VONAGE_APP_ID,
    privateKey: `${__dirname}/../data/private.key`,
};
export const vonage = new Vonage(config) as any;
