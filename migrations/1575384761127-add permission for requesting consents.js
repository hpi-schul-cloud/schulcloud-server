// eslint-disable-next-line no-unused-vars
const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { Schema } = mongoose;

const roleSchema = new Schema(
	{
		name: { type: String, required: true },
		permissions: [{ type: String }],

		// inheritance
		roles: [{ type: Schema.Types.ObjectId }],
	},
	{
		timestamps: true,
	}
);

const Role = mongoose.model('role323323', roleSchema, 'roles');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

const REQUEST_CONSENTS = 'REQUEST_CONSENTS';
const roleNames = ['teacher', 'administrator', 'superhero'];

module.exports = {
	up: async function up() {
		if (process.env.SC_THEME === 'thr') {
			info('no further updates required, this migration continues only iff SC_THEME is not set to "thr"');
			return Promise.resolve();
		}

		await connect();
		// ////////////////////////////////////////////////////
		for (const roleName of roleNames) {
			const role = await Role.findOne({ name: roleName }).exec();
			if (role === null) {
				throw new Error(`role not found: ${roleName}`);
			}
			if (role.permissions.includes(REQUEST_CONSENTS)) {
				info(`role ${roleName} already has permission ${REQUEST_CONSENTS}, ignore...`);
				break;
			} else {
				info(`add permission ${REQUEST_CONSENTS} into role ${roleName}...`);
				role.permissions.push(REQUEST_CONSENTS);
				role.permissions.sort();
				await role.save();
				info(`successfully added permission ${REQUEST_CONSENTS} for role ${roleName}.`);
			}
		}

		// ////////////////////////////////////////////////////
		await close();
		return Promise.resolve();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.

		for (const roleName of roleNames) {
			const role = await Role.findOne({ name: roleName }).exec();
			if (role === null) {
				throw new Error(`role not found: ${roleName}`);
			}
			if (role.permissions.includes(REQUEST_CONSENTS)) {
				info(`role ${roleName} has permission ${REQUEST_CONSENTS}, remove...`);
				role.permissions.pull(REQUEST_CONSENTS);
				await role.save();
				info(`permission ${REQUEST_CONSENTS} successfully removed from role ${roleName}.`);
			}
		}

		// ////////////////////////////////////////////////////
		await close();
		return Promise.resolve();
	},
};
