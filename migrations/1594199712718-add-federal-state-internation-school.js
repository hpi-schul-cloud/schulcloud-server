// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');
const federalStateModel = require('../src/services/federalState/model');

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		info('creating federal state "International"');
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		await federalStateModel.create({
			name: 'Internationale Schule',
			abbreviation: 'IN',
			logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Earth_icon_2.png',
		});
		// ////////////////////////////////////////////////////
		await close();
		info('created federal state "International"');
	},

	down: async function down() {
		info('deleting federal state "International"');
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		await federalStateModel.deleteOne({
			abbreviation: 'IN',
		});
		// ////////////////////////////////////////////////////
		await close();
		info('deleted federal state "International"');
	},
};
