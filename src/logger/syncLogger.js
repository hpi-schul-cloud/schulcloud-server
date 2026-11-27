const { Configuration } = require('@hpi-schul-cloud/commons');
const winston = require('winston');

const { format } = winston;
const { createLogger, maskSensitiveData, redactUrlSecretsInLine } = require('./utils');
const { ENVIRONMENTS } = require('../../config/environments');

const getDevelopFormat = () =>
	format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		maskSensitiveData(),
		format.prettyPrint({ depth: 5, colorize: true }),
		redactUrlSecretsInLine()
	);

const getProductionFormat = () =>
	format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		maskSensitiveData(),
		format.json(),
		redactUrlSecretsInLine()
	);

const getTestFormat = () =>
	format.combine(
		format.errors({ stack: true }),
		maskSensitiveData(),
		format.prettyPrint({ depth: 1, colorize: true }),
		redactUrlSecretsInLine()
	);

let selectedFormat;
switch (Configuration.get('NODE_ENV')) {
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
}
const syncLogger = createLogger(selectedFormat, Configuration.get('SYNC_LOG_LEVEL'));

module.exports = {
	syncLogger,
};
