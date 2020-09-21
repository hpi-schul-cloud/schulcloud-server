require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

require('../src/services/user/model');
require('../src/services/link/link-model');
const { courseModel } = require('../src/services/user-group/model');
require('../src/services/account/model');
require('../src/services/homework/model');

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.

		info('update account indexes...');
		await this('account').syncIndexes();
		info('done.');

		info('update link indexes...');
		await this('link').syncIndexes();
		info('done.');

		info('update homework indexes...');
		await this('homework').syncIndexes();
		info('done.');

		info('update submission indexes...');
		await this('submission').syncIndexes();
		info('done.');

		info('update user indexes...');
		await this('user').syncIndexes();
		info('done.');

		info('update courses indexes...');
		await courseModel.syncIndexes();
		info('done.');
		// ////////////////////////////////////////////////////
		await close();
	},
};
