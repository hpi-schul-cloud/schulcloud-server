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

const Role = mongoose.model('role3245', roleSchema, 'roles');

module.exports = {
	up: async function up() {
		await connect();

		info('Updating administrator role to include chat and logo manage permissions.');
		await Role.updateOne(
			{ name: 'administrator' },
			{
				$addToSet: {
					permissions: {
						$each: ['SCHOOL_LOGO_MANAGE', 'SCHOOL_CHAT_MANAGE'],
					},
				},
			}
		).exec();

		if (process.env.SC_THEME !== 'thr') {
			info('No further updates required, this migration continues only iff SC_THEME is set to "thr"');
			await close();
			return;
		}

		// in Thuringia, we need to remove SCHOOL_EDIT permissions from administrators
		await Role.updateOne(
			{ name: 'administrator' },
			{
				$pull: { permissions: 'SCHOOL_EDIT' },
			}
		).exec();

		await close();
	},

	down: async function down() {
		await connect();
		await Role.updateOne(
			{ name: 'administrator' },
			{
				$pull: {
					permissions: {
						$in: ['SCHOOL_LOGO_MANAGE', 'SCHOOL_CHAT_MANAGE'],
					},
				},
			}
		).exec();

		if (process.env.SC_THEME !== 'thr') {
			info('No further updates required, this migration continues only iff SC_THEME is set to "thr"');
			await close();
			return;
		}

		// in Thuringia, we need to remove SCHOOL_EDIT permissions from administrators
		await Role.updateOne(
			{ name: 'administrator' },
			{
				$addToSet: { permissions: 'SCHOOL_EDIT' },
			}
		).exec();
		await close();
	},
};
