const mongoose = require('mongoose');

const { connect, close } = require('../src/utils/database');

const System = require('../src/services/system/model');

/*
const System = mongoose.model('system', new mongoose.Schema(type: { type: String, required: true, enum: types },
	url: { type: String, required: false },
	alias: { type: String },
	webuntisConfig: {
		active: { type: Boolean },
		url: { type: String },
		user: { type: String },
		password: { type: String },
		schoolname: { type: String }
	}, {
	timestamps: true,
}));
*/

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		await System.updateMany({}, {
            $set: {
                "webuntisConfig": {
                    "active": false,
                    "url": "",
                    "user": "",
                    "password": "",
                    "schoolname": ""
                }
            },
		}).lean().exec();
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		await System.updateMany({}, {
			$unset: { "webuntisConfig": true }
		}).lean().exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
