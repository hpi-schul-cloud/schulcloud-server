/* eslint-disable no-nested-ternary */
const mongoose = require('mongoose');
const config = process.env.NODE_ENV === 'test'
	? require('../../config/test.json')
	: process.env.NODE_ENV === 'production'
		? require('../../config/production.json')
		: require('../../config/default.json');
/* eslint-enable no-nested-ternary */

async function setup() {
	mongoose.Promise = Promise;

	await mongoose.connect(
		process.env.DB_URL || config.mongodb,
		{ user: process.env.DB_USERNAME, pass: process.env.DB_PASSWORD },
	);
}

async function cleanup() {
	return mongoose.connection.close();
}

module.exports = { setup, cleanup };
