/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const mongoose = require('mongoose');
const diffHistory = require('mongoose-diff-history/diffHistory');
const GLOBALS = require('../../config/globals');
const logger = require('../logger/index');

const configurations = ['test', 'production', 'default', 'migration'];
const env = process.env.NODE_ENV || 'default';

if (!(configurations.includes(env))) {
	throw new Error('if defined, NODE_ENV must be set to test or production');
} else {
	logger.info(`NODE_ENV is set to ${env}`);
}

const config = require(`../../config/${env}.json`);

if (GLOBALS.DATABASE_AUDIT === 'true') {
	logger.info('database audit log enabled');
}

function enableAuditLog(schema, options) {
	if (GLOBALS.DATABASE_AUDIT === 'true') {
		// set database audit
		schema.plugin(diffHistory.plugin, options);
	}
}

function addAuthenticationToOptions(DB_USERNAME, DB_PASSWORD, options) {
	const auth = {};
	if (DB_USERNAME) {
		auth.user = DB_USERNAME;
	}
	if (DB_PASSWORD) {
		auth.password = DB_PASSWORD;
	}
	if (DB_USERNAME || DB_PASSWORD) {
		options.auth = auth;
	}
}

function getConnectionOptions() {
	// read env params
	const {
		DB_URL = config.mongodb,
		DB_USERNAME,
		DB_PASSWORD,
	} = process.env;

	return {
		url: DB_URL,
		username: DB_USERNAME,
		password: DB_PASSWORD,
	};
}

function connect() {
	mongoose.Promise = global.Promise;
	const options = getConnectionOptions();

	logger.info('connect to database host',
		options.url,
		options.username ? `with username ${options.username}` : 'without user',
		options.password ? 'and' : 'and without', 'password');

	// initialize mongoose
	const mongooseOptions = {
		useMongoClient: true,
	};

	addAuthenticationToOptions(
		options.username,
		options.password,
		mongooseOptions,
	);

	return mongoose.connect(
		options.url,
		mongooseOptions,
	);
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
