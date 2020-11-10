<<<<<<< HEAD
const winston = require('winston');

const { format, transports, createLogger } = winston;
const { LOG_LEVEL, ENVIRONMENTS } = require('../../config/globals');
const { Configuration } = require('@schul-cloud/commons');

const addType = format.printf((log) => {
	if (log.stack || log.level === 'error') {
		log.type = 'error';
	} else {
		log.type = 'log';
	}
	return log;
});

const colorize = (Configuration.get('NODE_ENV') !== "production");
let formater;
if (Configuration.get('NODE_ENV') === "test") {
	formater = format.combine(format.prettyPrint({ depth: 1, colorize }));
} else {
	formater = format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		addType,
		format.prettyPrint({ depth: 3, colorize })
	);
=======
const { LOG_LEVEL, NODE_ENV, ENVIRONMENTS } = require('../../config/globals');
const { getDevelopFormat, getProductionFormat, getTestFormat, createLogger } = require('./utils');

let selectedFormat;
switch (NODE_ENV) {
	case ENVIRONMENTS.TEST:
		selectedFormat = getTestFormat();
		break;
	case ENVIRONMENTS.PRODUCTION:
		selectedFormat = getProductionFormat();
		break;
	case ENVIRONMENTS.DEVELOPMENT:
	case ENVIRONMENTS.MIGRATION:
	default:
		selectedFormat = getDevelopFormat();
>>>>>>> 4f7a998596e9286942e99c5e1ebdb1f13fdb66fd
}

const logger = createLogger(selectedFormat, LOG_LEVEL);

module.exports = logger;
