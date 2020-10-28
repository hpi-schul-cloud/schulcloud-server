/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const mongoose = require('mongoose');
const diffHistory = require('mongoose-diff-history/diffHistory');
const uriFormat = require('mongodb-uri');
const { Configuration } = require('@schul-cloud/commons');

const logger = require('../logger');
const {
	DATABASE_AUDIT,
	MONGOOSE_CONNECTION_POOL_SIZE,
	DB_URL,
	DB_USERNAME,
	DB_PASSWORD,
	ENVIRONMENTS,
} = require('../../config/globals');

if (DATABASE_AUDIT === 'true') {
	logger.info('database audit log is globally enabled');
} else {
	logger.info('database audit log is globally disabled');
}

const encodeMongoURI = (urlString) => {
	if (urlString) {
		const parsed = uriFormat.parse(urlString);
		return uriFormat.format(parsed);
	}
	return urlString;
};

function enableAuditLog(schema, options) {
	if (DATABASE_AUDIT === 'true') {
		// set database audit
		schema.plugin(diffHistory.plugin, options);
	}
}

function addAuthenticationToMongooseOptions(username, password, mongooseOptions) {
	const auth = {};
	if (username) {
		auth.user = username;
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
 * creates the initial connection to a mongodb.
 * see https://mongoosejs.com/docs/connections.html#error-handling for error handling
 *
 * @returns {Promise} rejects on initial errors
 */
function connect() {
	mongoose.Promise = global.Promise;
	const options = getConnectionOptions();

	logger.info(
		'connect to database host',
		options.url,
		options.username ? `with username ${options.username}` : 'without user',
		options.password ? 'and' : 'and without',
		'password'
	);

	const mongooseOptions = {
		autoIndex: Configuration.get('NODE_ENV') !== "production",
		poolSize: MONGOOSE_CONNECTION_POOL_SIZE,
		useNewUrlParser: true,
		useFindAndModify: false,
		useCreateIndex: true,
		useUnifiedTopology: true,
	};

	addAuthenticationToMongooseOptions(options.username, options.password, mongooseOptions);

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

module.exports = {
	connect,
	close,
	getConnectionOptions,
	enableAuditLog,
};
