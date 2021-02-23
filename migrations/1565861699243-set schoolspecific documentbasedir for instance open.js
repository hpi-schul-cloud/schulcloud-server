const { connect, close } = require('../src/utils/database');
const { info, warning } = require('../src/logger');

const { schoolModel: School } = require('../src/services/school/model');
const globals = require('../config/globals');

module.exports = {
	up: async function up() {
		if (globals.SC_THEME !== 'open') {
			info('Migration will be applied to open instance only! Ignore...');
			return Promise.resolve();
		}

		await connect();
		await School.updateMany(
			{},
			{
				documentBaseDirType: 'school',
			}
		)
			.lean()
			.exec();

		await close();

		info('Migration has been applied to this instance of open');
		return Promise.resolve();
	},

	down: async function down() {
		warning('operation not supported');
	},
};
