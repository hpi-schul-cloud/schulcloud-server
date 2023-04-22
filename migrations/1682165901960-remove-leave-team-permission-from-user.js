const mongoose = require('mongoose');
const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model(
	'role_202304221410',
	new mongoose.Schema(
		{
			name: { type: String, required: true },
			permissions: [{ type: String }]
		},
		{
			timestamps: true
		}
	),
	'roles'
);

module.exports = {
	up: async function up() {
		await connect();

		await Roles.updateOne(
			{
				name: 'teammember'
			},
			{
				$pull: {
					permissions: {
						$in: ['LEAVE_TEAM']
					}
				},
			}
		).exec();
		await close();
	},

	down: async function down() {
		await connect();
		await Roles.updateOne(
			{
				name: 'teammember'
			},
			{
				$addToSet: {
					permissions: {
						$each: ['LEAVE_TEAM']
					}
				},
			}
		).exec();
		await close();
	},
};
