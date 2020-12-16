const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { schoolSchema, SCHOOL_OF_DELETE_USERS_NAME } = require('../src/services/school/model');

const { connect, close } = require('../src/utils/database');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

const SchoolModel = mongoose.model('school', schoolSchema);

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		await SchoolModel.create({
			name: SCHOOL_OF_DELETE_USERS_NAME,
		});
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		await SchoolModel.findOneAndDelete({
			name: SCHOOL_OF_DELETE_USERS_NAME,
		});
		// ////////////////////////////////////////////////////
		await close();
	},
};
