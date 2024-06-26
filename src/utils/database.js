/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const mongoose = require('mongoose');
const uriFormat = require('mongodb-uri');
const { Configuration } = require('@hpi-schul-cloud/commons');
const logger = require('../logger');
const {
	NODE_ENV,
	MONGOOSE_CONNECTION_POOL_SIZE,
	DB_URL,
	DB_USERNAME,
	DB_PASSWORD,
	ENVIRONMENTS,
} = require('../../config/globals');

logger.info('database audit log is globally disabled');

const encodeMongoURI = (urlString) => {
	if (urlString) {
		const parsed = uriFormat.parse(urlString);
		return uriFormat.format(parsed);
	}
	return urlString;
};

function addAuthenticationToMongooseOptions(username, password, mongooseOptions) {
	const auth = {};
	if (username) {
		auth.username = username;
	}
	if (password) {
		auth.password = password;
	}
	if (username || password) {
		mongooseOptions.auth = auth;
	}
}

function getConnectionOptions() {
	return {
		url: DB_URL,
		username: DB_USERNAME,
		password: DB_PASSWORD,
	};
}

/**
 * Splitting the inputs into 3 letters for search indexing.
 * + first letter
 * + first two letters combination
 * to increase the quality
 *
 * @param {*} string
 * @returns [Array]
 */
const splitForSearchIndexes = (...searchTexts) => {
	const arr = [];
	searchTexts.forEach((item) => {
		item.split(' ').forEach((it) => {
			// eslint-disable-next-line no-plusplus
			if (it.length === 0) return;

			arr.push(it.slice(0, 1));
			if (it.length > 1) arr.push(it.slice(0, 2));
			for (let i = 0; i < it.length - 2; i += 1) arr.push(it.slice(i, i + 3));
		});
	});
	return arr;
};

/**
 * creates the initial connection to a mongodb.
 * see https://mongoosejs.com/docs/connections.html#error-handling for error handling
 *
 * @returns {Promise} rejects on initial errors
 */
function connect() {
	mongoose.Promise = global.Promise;
	const options = getConnectionOptions();

	logger.info('connect to database host');

	const mongooseOptions = {
		autoIndex: NODE_ENV !== ENVIRONMENTS.PRODUCTION,
		maxPoolSize: MONGOOSE_CONNECTION_POOL_SIZE, // https://mongoosejs.com/docs/migrating_to_6.html#mongodb-driver-40
		useNewUrlParser: true,
	};

	addAuthenticationToMongooseOptions(options.username, options.password, mongooseOptions);
	// https://mongoosejs.com/docs/6.x/docs/migrating_to_6.html#strictquery-is-removed-and-replaced-by-strict
	// https://mongoosejs.com/docs/7.x/docs/migrating_to_7.html#strictquery
	mongoose.set('strictQuery', false);
	return mongoose.connect(encodeMongoURI(options.url), mongooseOptions).then((resolved) => {
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

if (Configuration.get('FEATURE_MONGOOSE_LOGGING_ENABLED')) {
	mongoose.set('debug', true);
}

module.exports = {
	connect,
	close,
	getConnectionOptions,
	splitForSearchIndexes,
};
