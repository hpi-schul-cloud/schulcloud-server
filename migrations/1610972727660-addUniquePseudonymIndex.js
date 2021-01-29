const pseudonymModel = require('../src/services/pseudonym/model');
// eslint-disable-next-line no-unused-vars
const { alert } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

const syncIndexes = async () => {
	alert('start updating pseudonym indexes...');
	await pseudonymModel.syncIndexes();
	alert('finished updating pseudonym indexes...');
};

module.exports = {
	up: async function up() {
		await connect();
		alert('start deleting existing pseudonyms');
		await pseudonymModel.deleteMany({});
		alert('finished deleting existing pseudonyms');
		await syncIndexes();
		await close();
	},

	down: async function down() {
		await connect();
		await syncIndexes();
		await close();
	},
};
