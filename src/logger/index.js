const winston = require('winston');

const { transports, createLogger } = winston;
const { LOG_LEVEL, NODE_ENV, ENVIRONMENTS } = require('../../config/globals');
const { getDevelopFormat, getProductionFormat, getTestFormat } = require('./utils');

let selectedFormat;
switch (NODE_ENV) {
	case ENVIRONMENTS.TEST:
		selectedFormat = getTestFormat();
		break;
	case ENVIRONMENTS.PRODUCTION:
		selectedFormat = getProductionFormat();
		break;
	default:
		selectedFormat = getDevelopFormat();
}

const logger = createLogger({
	levels: winston.config.syslog.levels,
	level: LOG_LEVEL,
	format: selectedFormat,
	transports: [
		new transports.Console({
			level: LOG_LEVEL,
			handleExceptions: true,
			// https://github.com/winstonjs/winston#handling-uncaught-promise-rejections-with-winston
			handleRejections: true,
		}),
	],
	exitOnError: false,
});

module.exports = logger;
