const mongoose = require('mongoose');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const Roles = mongoose.model(
	'role_202304011542',
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
			{ name: 'teacher' },
			{
				$addToSet: {
					permissions: {
						$each: ['TASK_CARD_VIEW', 'TASK_CARD_EDIT'],
					},
				},
			}
		).exec();

		await close();
	},

	down: async function down() {
		await connect();

		await Roles.updateOne(
			{ name: 'teacher' },
			{
				$pull: {
					permissions: {
						$in: ['TASK_CARD_VIEW', 'TASK_CARD_EDIT'],
					},
				},
			}
		).exec();

		await close();
	},
};
