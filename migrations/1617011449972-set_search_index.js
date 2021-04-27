const { info } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { userModel } = require('../src/services/user/model/index');

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		info('sync User indexes');
		await userModel.syncIndexes();
		// ////////////////////////////////////////////////////
		await close();
	},

	down: (done) => {
		info('syncUserIndex down do nothing');
		done();
	},
};
