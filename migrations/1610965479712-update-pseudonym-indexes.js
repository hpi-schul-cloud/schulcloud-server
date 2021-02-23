const pseudonymModel = require('../src/services/pseudonym/model');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

const syncIndexes = async () => {
	await connect();
	info('start updating pseudonym indexes...');
	await pseudonymModel.syncIndexes();
	info('finished updating pseudonym indexes...');
	await close();
};

module.exports = {
	up: async function up() {
		await syncIndexes();
	},

	down: async function down() {
		await syncIndexes();
	},
};
