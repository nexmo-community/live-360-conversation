import { createLogger, transports, format } from 'winston';

export const loggerConfig = {
    level: 'debug',
    transports: [new transports.Console()],
    format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({ timestamp, level, message, ...rest }) => {
            return `[${timestamp}] ${level}: ${message} ${JSON.stringify(rest, null, 2)}`;
        }),
    ),
};
export const logger = createLogger(loggerConfig);
