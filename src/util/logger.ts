import * as log from 'loglevel';
import {Logger} from 'loglevel';

export const getLogger = (name: string): Logger => {
    const logger = log.getLogger(name);

    // Set log level from environment or default to info
    const logLevel = (process.env.LOG_LEVEL || 'info') as log.LogLevelDesc;
    logger.setLevel(logLevel);

    return logger;
};
