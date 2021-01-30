const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const roleModel = require('../src/services/role/model');
const { SC_THEME } = require('../config/globals');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////

		// the following permission changes have been applied to THR production:

		// added permission HOMEWORK_CREATE to role user for THR production

		// removed permission STUDENT_EDIT from role user for THR production

		// removed permissions on admin role:
		// TEACHER_CREATE,TEACHER_EDIT, CLASS_CREATE, CLASS_EDIT, CLASS_REMOVE

		// removed permissions on teacher role:
		// CLASS_CREATE, CLASS_EDIT, CLASS_REMOVE

		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////

		// ////////////////////////////////////////////////////
		await close();
	},
};
