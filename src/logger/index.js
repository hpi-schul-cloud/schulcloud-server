const { Configuration } = require('@hpi-schul-cloud/commons');
const { ENVIRONMENTS } = require('../../config/environments');
const { getDevelopFormat, getProductionFormat, getTestFormat, createLogger } = require('./utils');


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

const logger = createLogger(selectedFormat, Configuration.get('LOG_LEVEL'));

module.exports = logger;
