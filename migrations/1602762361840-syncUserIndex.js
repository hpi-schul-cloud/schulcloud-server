const { info } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

require('../src/services/user/model');

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		info('sync User indexes');
		this('user').syncIndexes();
		// ////////////////////////////////////////////////////
		await close();
	},

	down: (done) => {
		info('syncUserIndex down do nothing');
		done();
	},
};
