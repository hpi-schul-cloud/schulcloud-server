require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// ? How to access permissions?
require('../src/services/user/model');
require('../src/services/link/link-model');
require('../src/services/user-group/model');
require('../src/services/homework/model');
require('../src/services/account/model');

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		this('account').syncIndexes();
		this('link').syncIndexes();
		this('homework').syncIndexes();
		this('submission').syncIndexes();
		this('user').syncIndexes();
		this('course').syncIndexes();
		// ////////////////////////////////////////////////////
		await close();
	},
};
