const { connect, close } = require('../src/utils/database');

const RoleModel = require('../src/services/role/model');

// Gives admin permission to create and edit news.

module.exports = {
	up: async function up() {
		await connect();

		await RoleModel.findOneAndUpdate(
			{
				name: 'administrator',
			},
			{
				$addToSet: {
					permissions: { $each: ['NEWS_CREATE', 'NEWS_EDIT', 'SCHOOL_NEWS_EDIT'] },
				},
			}
		)
			.lean()
			.exec();
		await close();
	},

	down: async function down() {
		await connect();
		await RoleModel.findOneAndUpdate(
			{
				name: 'administrator',
			},
			{
				$pull: {
					permissions: {
						$in: ['NEWS_CREATE', 'NEWS_EDIT', 'SCHOOL_NEWS_EDIT'],
					},
				},
			}
		)
			.lean()
			.exec();
		await close();
	},
};
