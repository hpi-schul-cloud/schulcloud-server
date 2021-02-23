const { connect, close } = require('../src/utils/database');
const Roles = require('../src/services/role/model');

module.exports = {
	up: async function up() {
		await connect();
		await Roles.updateOne({ name: 'teacher' }, { $addToSet: { permissions: 'ENTERTHECLOUD_START' } }).exec();
		await Roles.updateOne({ name: 'administrator' }, { $addToSet: { permissions: 'ENTERTHECLOUD_START' } }).exec();
		await close();
	},

	down: async function down() {
		await connect();
		await Roles.updateOne({ name: 'teacher' }, { $pull: { permissions: 'ENTERTHECLOUD_START' } }).exec();
		await Roles.updateOne({ name: 'administrator' }, { $pull: { permissions: 'ENTERTHECLOUD_START' } }).exec();
		await close();
	},
};
