/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const mongoose = require('mongoose');
const uriFormat = require('mongodb-uri');
const { Configuration } = require('@hpi-schul-cloud/commons');
const logger = require('../logger');
const { ENVIRONMENTS } = require('../../config/environments');

const encodeMongoURI = (urlString) => {
	if (urlString) {
		const parsed = uriFormat.parse(urlString);
		return uriFormat.format(parsed);
	}
	return urlString;
};

/**
 * creates the initial connection to a mongodb.
 * see https://mongoosejs.com/docs/connections.html#error-handling for error handling
 *
 * @returns {Promise} rejects on initial errors
 */
function connect() {
	mongoose.Promise = global.Promise;
	logger.info('connect to database host');

	const mongooseOptions = {
		autoIndex: Configuration.get('NODE_ENV') !== ENVIRONMENTS.PRODUCTION,
		maxPoolSize:  Configuration.get('MONGOOSE_CONNECTION_POOL_SIZE'), // https://mongoosejs.com/docs/migrating_to_6.html#mongodb-driver-40
		// useNewUrlParser: true, @DEPRICATED in mongoose 6, now default
	};

	const auth = {};
	if (Configuration.has('DB_USERNAME')) {
		auth.username = Configuration.get('DB_USERNAME');
	}
	if (Configuration.has('DB_PASSWORD')) {
		auth.password = Configuration.get('DB_PASSWORD');
	}
	if (auth.username || auth.password) {
		mongooseOptions.auth = auth;
	}

	// https://mongoosejs.com/docs/6.x/docs/migrating_to_6.html#strictquery-is-removed-and-replaced-by-strict
	// https://mongoosejs.com/docs/7.x/docs/migrating_to_7.html#strictquery
	mongoose.set('strictQuery', false);

	if (Configuration.get('FEATURE_MONGOOSE_LOGGING_ENABLED')) {
		mongoose.set('debug', true);
	} else {
		logger.info('database debug log is globally disabled');
	}

	return mongoose.connect(encodeMongoURI(Configuration.get('DB_URL')), mongooseOptions).then((resolved) => {
		// handle errors that appear after connection setup
		mongoose.connection.on('error', (err) => {
			logger.error(err);
		});
		return resolved;
	});
}

function close() {
	return mongoose.connection.close();
}

module.exports = {
	connect,
	close,
};
