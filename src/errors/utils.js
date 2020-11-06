const Sentry = require('@sentry/node');
const logger = require('../logger');

const asyncErrorLog = (err, message) => {
	if (message) {
		logger.error(message, err);
	} else {
		logger.error(err);
	}
	// TODO execute filter must outsource from error pipline
	Sentry.captureException(err);
};

module.exports = {
	asyncErrorLog,
};
