const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const Roles = mongoose.model(
	'role_202304011545',
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
			{
				name: 'teacher',
			},
			{
				$addToSet: {
					permissions: {
						$each: ['HOMEWORK_CREATE', 'HOMEWORK_EDIT'],
					},
				},
			}
		).exec();
		alert(`Permission HOMEWORK_CREATE and HOMEWORK_EDIT added to role teacher`);

		await Roles.updateMany(
			{
				name: {
					$in: ['user', 'courseStudent'],
				},
			},
			{
				$pull: {
					permissions: {
						$in: ['HOMEWORK_CREATE', 'HOMEWORK_EDIT'],
					},
				},
			}
		).exec();

		alert(`Permission HOMEWORK_CREATE and HOMEWORK_EDIT removed from role user and courseStudent`);
	},

	down: async function down() {
		alert(`Is nothing to rollback`);
	},
};
