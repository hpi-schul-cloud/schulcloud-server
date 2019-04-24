/* eslint-disable global-require */
const mongoose = require('mongoose');
const logger = require('../logger/index');

let config;
switch (process.env.NODE_ENV) {
	case ('test'):
		logger.info('load configuration for test environment');
		config = require('../../config/test.json');
		break;
	case ('production'):
		logger.info('load configuration for production environment');
		config = require('../../config/production.json');
		break;
	default:
		logger.info('load configuration for default environment');
		config = require('../../config/default.json');
}

function connect() {
	mongoose.Promise = global.Promise;

	const host = process.env.DB_URL || config.mongodb;
	const user = process.env.DB_USERNAME;
	const pass = process.env.DB_PASSWORD;

	logger.info('connect to database host',
		host, user ? `with username ${user}` : 'without user',
		pass ? 'and' : 'and without', 'password');

	return mongoose.connect(
		host,
		{
			user,
			pass,
			useMongoClient: true,
		},
	);
}

function close() {
	return mongoose.connection.close();
}

module.exports = { connect, close };
