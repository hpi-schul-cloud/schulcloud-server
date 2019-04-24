/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const mongoose = require('mongoose');
const logger = require('../logger/index');

const configurations = ['test', 'production', 'default'];
const env = process.env.NODE_ENV || 'default';

if (!(configurations.includes(env))) {
	throw new Error('if defined, NODE_ENV must be set to test or production');
} else {
	logger.info(`NODE_ENV is set to ${env}`);
}

const config = require(`../../config/${env}.json`);

function connect() {
	mongoose.Promise = global.Promise;

	const {
		DB_URL = config.mongodb,
		DB_USERNAME,
		DB_PASSWORD,
	} = process.env;

	logger.info('connect to database host',
		DB_URL,
		DB_USERNAME ? `with username ${DB_USERNAME}` : 'without user',
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

module.exports = {
	connect,
	close: mongoose.connection.close,
};
