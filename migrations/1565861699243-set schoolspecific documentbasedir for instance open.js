const { connect, close } = require('../src/utils/database');
const { info, warning } = require('../src/logger');

const { schoolModel: School } = require('../src/services/school/model');
const globals = require('../config/globals');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

module.exports = {
	up: async function up() {
		if (globals.SC_THEME !== 'open') {
			info('Migration will be applied to open instance only! Ignore...');
			return Promise.resolve();
		}

		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		await School.updateMany({}, {
			documentBaseDirType: 'school',
		}).lean().exec();

		// ////////////////////////////////////////////////////
		await close();

		info('Migration has been applied to this instance of open');
		return Promise.resolve();
	},

	down: async function down() {
		warning('operation not supported');
	},
};
