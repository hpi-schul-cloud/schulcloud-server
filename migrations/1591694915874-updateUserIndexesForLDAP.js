const mongoose = require('mongoose');

const { connect, close } = require('../src/utils/database');

const { userSchema } = require('../src/services/user/model/user.schema');

const User = mongoose.model('user87324782376247457621', userSchema, 'user');

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		await User.syncIndexes();
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		await User.syncIndexes();
		// ////////////////////////////////////////////////////
		await close();
	},
};
