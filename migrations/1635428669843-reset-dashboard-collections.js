const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

// TODO npm run migration-persist and remove this line

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// drop dashboard collections to erase any invalid data.
		// the data within these collections is currently only automatically created, so they are save to remove.
		// its possible that any or all of these collections dont exist, so we catch errors that are thrown if the collection is not found.
		await mongoose.connection.db.dropCollection('dashboard').catch(() => {});
		await mongoose.connection.db.dropCollection('dashboardelement').catch(() => {});
		await mongoose.connection.db.dropCollection('dashboarddefaultreference').catch(() => {});
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		info('no rollback necessary, since so far there are only fake dashboards, that are created automatically');
		// ////////////////////////////////////////////////////
		await close();
	},
};
