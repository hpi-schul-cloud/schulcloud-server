const { connect, close } = require('../src/utils/database');
const Roles = require('../src/services/role/model');

module.exports = {
	up: async function up() {
		await connect();
		await Roles.updateMany(
			{
				name: { $in: ['courseTeacher', 'courseSubstitutionTeacher'] },
			},
			{
				$addToSet: { permissions: 'SCOPE_PERMISSIONS_VIEW' },
			}
		);
		await close();
	},

	down: async function down() {
		await connect();
		await Roles.updateMany(
			{
				name: { $in: ['courseTeacher', 'courseSubstitutionTeacher'] },
			},
			{
				$pull: { permissions: 'SCOPE_PERMISSIONS_VIEW' },
			}
		);
		await close();
	},
};
