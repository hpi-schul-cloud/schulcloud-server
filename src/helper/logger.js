const winston = require('winston');
const { Configuration } = require('@schul-cloud/commons');
const { NODE_ENV } = require('../../config/globals');

const { format, transports, createLogger } = winston;

const logLevel = Configuration.get('LOG_LEVEL');
const colorize = NODE_ENV !== 'production';
let formater;

if (NODE_ENV === 'test') {
    formater = format.combine(
        format.prettyPrint({ depth: 1, colorize }),
    );
} else {
    formater = format.combine(
        format.errors({ stack: true }),
        format.timestamp(),
        format.prettyPrint({ depth: 3, colorize }),
    );
}


const logger = createLogger({
    level: logLevel,
    transports: [
        new transports.Console({
            level: logLevel,
            format: formater,
        }),
    ],
});

module.exports = logger;