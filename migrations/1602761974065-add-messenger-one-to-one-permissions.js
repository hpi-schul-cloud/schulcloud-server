const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model(
	'messengerRoomCreatePermissions',
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
			{ name: 'superhero' },
			{
				$addToSet: {
					permissions: {
						$each: ['MESSENGER_ROOM_CREATE'],
					},
				},
			}
		).exec();
		await Roles.updateOne(
			{ name: 'administrator' },
			{
				$addToSet: {
					permissions: {
						$each: ['MESSENGER_ROOM_CREATE'],
					},
				},
			}
		).exec();
		await Roles.updateOne(
			{ name: 'teacher' },
			{
				$addToSet: {
					permissions: {
						$each: ['MESSENGER_ROOM_CREATE'],
					},
				},
			}
		).exec();
		await close();
	},

	down: async function down() {
		await connect();
		await Roles.updateOne(
			{ name: 'superhero' },
			{
				$pull: {
					permissions: {
						$in: ['MESSENGER_ROOM_CREATE'],
					},
				},
			}
		).exec();
		await Roles.updateOne(
			{ name: 'administrator' },
			{
				$pull: {
					permissions: {
						$in: ['MESSENGER_ROOM_CREATE'],
					},
				},
			}
		).exec();
		await Roles.updateOne(
			{ name: 'teacher' },
			{
				$pull: {
					permissions: {
						$in: ['MESSENGER_ROOM_CREATE'],
					},
				},
			}
		).exec();
		await close();
	},
};
