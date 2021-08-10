const { connect, close } = require('../src/utils/database');
const Roles = require('../src/services/role/model');

module.exports = {
	up: async function up() {
		await connect();
		await Roles.updateOne({ name: 'superhero' }, { $addToSet: { permissions: { $each: ['ADMIN_EDIT'] } } }).exec();
		await close();
	},

	down: async function down() {
		await connect();
		await Roles.updateOne({ name: 'superhero' }, { $pull: { permissions: { $in: ['ADMIN_EDIT'] } } }).exec();
		await close();
	},
};
