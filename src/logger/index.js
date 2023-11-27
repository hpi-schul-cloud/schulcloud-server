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
}

const logger = createLogger(selectedFormat, LOG_LEVEL);

module.exports = logger;
