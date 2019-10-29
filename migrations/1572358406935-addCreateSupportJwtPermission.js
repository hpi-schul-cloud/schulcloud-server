const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const RoleModel = mongoose.model('role', new mongoose.Schema({
	name: { type: String, required: true },
	permissions: [{ type: String }],
}, {
	timestamps: true,
}));

module.exports = {
	up: async function up() {
		await connect();

		await RoleModel.findOneAndUpdate(
			{
				name: 'superhero',
			}, {
				$addToSet: { permissions: 'CREATE_SUPPORT_JWT' },
			},
		).lean().exec();
		await close();
	},

	down: async function down() {
		await connect();

		await RoleModel.findOneAndUpdate(
			{
				name: 'superhero',
			}, {
				$pull: { permissions: 'CREATE_SUPPORT_JWT' },
			},
		).lean().exec();
		await close();
	},
};
