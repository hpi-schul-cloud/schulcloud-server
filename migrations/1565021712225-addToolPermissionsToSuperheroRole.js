const { connect, close } = require('../src/utils/database');
const Roles = require('../src/services/role/model');

module.exports = {
	up: async function up() {
		await connect();
		await Roles.updateOne(
			{ name: 'superhero' },
			{ $addToSet: { permissions: { $each: ['TOOL_CREATE', 'TOOL_EDIT'] } } }
		).exec();
		await close();
	},

	down: async function down() {
		await connect();
		await Roles.updateOne(
			{ name: 'superhero' },
			{ $pull: { permissions: { $in: ['TOOL_CREATE', 'TOOL_EDIT'] } } }
		).exec();
		await close();
	},
};
