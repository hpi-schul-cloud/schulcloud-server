const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const Roles = mongoose.model(
	'messengersyncroles',
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

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		await connect();
		await Roles.updateOne(
			{ name: 'superhero' },
			{
				$addToSet: {
					permissions: {
						$each: ['MESSENGER_SYNC'],
					},
				},
			}
		).exec();
		await Roles.updateOne(
			{ name: 'administrator' },
			{
				$addToSet: {
					permissions: {
						$each: ['MESSENGER_SYNC'],
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
						$in: ['MESSENGER_SYNC'],
					},
				},
			}
		).exec();
		await Roles.updateOne(
			{ name: 'administrator' },
			{
				$pull: {
					permissions: {
						$in: ['MESSENGER_SYNC'],
					},
				},
			}
		).exec();
		await close();
	},
};
