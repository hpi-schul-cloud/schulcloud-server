const { Configuration } = require('@hpi-schul-cloud/commons');
const winston = require('winston');

const { format } = winston;
const { createLogger } = require('./utils');
const { NODE_ENV, ENVIRONMENTS } = require('../../config/globals');

const getDevelopFormat = () =>
	format.combine(format.errors({ stack: true }), format.timestamp(), format.prettyPrint({ depth: 5, colorize: true }));

const getProductionFormat = () =>
	format.combine(format.errors({ stack: true }), format.timestamp(), format.prettyPrint({ depth: 5, colorize: false }));

const getTestFormat = () => format.combine(format.prettyPrint({ depth: 1, colorize: true }));

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
}
const syncLogger = createLogger(selectedFormat, Configuration.get('SYNC_LOG_LEVEL'));

module.exports = {
	syncLogger,
};
