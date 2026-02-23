const mongoose = require('mongoose');
const uriFormat = require('mongodb-uri');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { ENVIRONMENTS } = require('../../config/environments');
const logger = require('../logger');

const encodeMongoURI = (urlString) => {
	if (urlString) {
		const parsed = uriFormat.parse(urlString);
		return uriFormat.format(parsed);
	}
	return urlString;
};

function connect() {
	mongoose.Promise = global.Promise;
	logger.info('connect to database host');

	const mongooseOptions = {
		autoIndex: Configuration.get('NODE_ENV') !== ENVIRONMENTS.PRODUCTION,
		maxPoolSize:  Configuration.get('MONGOOSE_CONNECTION_POOL_SIZE'),
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

	if (Configuration.get('FEATURE_MONGOOSE_LOGGING_ENABLED')) {
		mongoose.set('debug', true);
		logger.info('database debug log is globally enabled');
	}

	return mongoose.connect(encodeMongoURI(Configuration.get('DB_URL')), mongooseOptions).then((resolved) => {
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
