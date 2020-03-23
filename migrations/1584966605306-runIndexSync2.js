require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

require('../src/services/homework/model');

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		info('update homework indexes...');
		this('homework').syncIndexes();
		info('updated homework indexes successfully');

		info('update submission indexes...');
		this('submission').syncIndexes();
		info('updated submission indexes successfully');

		info('update courses indexes...');
		this('courses').syncIndexes();
		info('updated courses indexes successfully');
		// ////////////////////////////////////////////////////
		await close();
	},
};
