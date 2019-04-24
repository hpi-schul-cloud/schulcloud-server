/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const mongoose = require('mongoose');
const logger = require('../logger/index');

const configurations = {
	test: '../../config/test.json',
	production: '../../config/production.json',
	default: '../../config/default.json',
};

const currentConfiguration = process.env.NODE_ENV || 'default';

if (!currentConfiguration) {
	throw new Error('if defined, NODE_ENV must be set to test or production');
}

const config = require(configurations[currentConfiguration]);

function connect() {
	mongoose.Promise = global.Promise;

	const DB_URL = process.env.DB_URL || config.mongodb;
	const { DB_USERNAME, DB_PASSWORD } = process.env;

	logger.info('connect to database host',
		DB_URL, DB_USERNAME ? `with username ${DB_USERNAME}` : 'without user',
		DB_PASSWORD ? 'and' : 'and without', 'password');

	return mongoose.connect(
		DB_URL,
		{
			DB_USERNAME,
			DB_PASSWORD,
			useMongoClient: true,
		},
	);
}

function close() {
	return mongoose.connection.close();
}

module.exports = { connect, close };
