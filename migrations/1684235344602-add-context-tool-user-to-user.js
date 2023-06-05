const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model(
	'roles160520231309',
	new mongoose.Schema(
		{
			name: { type: String, required: true },
			permissions: [{ type: String }],
		},
		{
			timestamps: true,
		}
	),
	'roles'
);

module.exports = {
	up: async function up() {
		await connect();

		await Roles.updateOne(
			{ name: 'user' },
			{
				$addToSet: {
					permissions: {
						$each: ['CONTEXT_TOOL_USER'],
					},
				},
			}
		).exec();
		alert(`Permission CONTEXT_TOOL_USER added to role user`);
		await close();
	},

	down: async function down() {
		await connect();

		await Roles.updateOne(
			{ name: 'user' },
			{
				$pull: {
					permissions: {
						$in: ['CONTEXT_TOOL_USER'],
					},
				},
			}
		).exec();
		alert(`Permission CONTEXT_TOOL_ADMIN removed from role user`);
		await close();
	},
};
