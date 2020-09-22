const { connect, close } = require('../src/utils/database');
const Roles = require('../src/services/role/model');

module.exports = {
	up: async function up() {
		await connect();
		await Roles.updateOne({ name: 'administrator' }, { $addToSet: { permissions: 'USERGROUP_FULL_ADMIN' } }).exec();
		await close();
	},

	down: async function down() {
		await connect();
		await Roles.updateOne({ name: 'administrator' }, { $pull: { permissions: 'USERGROUP_FULL_ADMIN' } }).exec();
		await close();
	},
};
