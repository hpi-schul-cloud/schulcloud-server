const mongoose = require('mongoose');
const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model('role', new mongoose.Schema({
	name: { type: String, required: true },
	permissions: [{ type: String }],
}, {
	timestamps: true,
}));

module.exports = {
	up: async function up() {
		await connect();
		await Roles.updateOne(
			{ name: 'administrator' },
			{ $addToSet: { permissions: 'INSIGHTS_VIEW' } },
		).exec();
		await Roles.updateOne(
			{ name: 'teacher' },
			{ $addToSet: { permissions: 'INSIGHTS_VIEW' } },
		).exec();
		await close();
	},

	down: async function down() {
		await connect();
		await Roles.updateOne(
			{ name: 'administrator' },
			{ $pull: { permissions: 'INSIGHTS_VIEW' } },
		).exec();
		await Roles.updateOne(
			{ name: 'teacher' },
			{ $pull: { permissions: 'INSIGHTS_VIEW' } },
		).exec();
		await close();
	},
};
