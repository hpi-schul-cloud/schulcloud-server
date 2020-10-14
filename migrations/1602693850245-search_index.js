/* eslint-disable no-await-in-loop */
const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const User = mongoose.model(
	'makeMeUnique',
	new mongoose.Schema(
		{
			firstName: { type: String, required: true },
			lastName: { type: String, required: true },
			email: { type: String, required: true, lowercase: true },
			searchIndexes: { type: mongoose.Schema.Types.Array },
		},
		{
			timestamps: true,
		}
	),
	'users'
);

const splitForSearchIndexes = (...searchTexts) => {
	const arr = [];
	searchTexts.forEach((item) => {
		item
			.split(' ')
			.filter((text) => text !== '')
			.forEach((it) => {
				// eslint-disable-next-line no-plusplus
				for (let i = 0; i < it.length - 2; i++) arr.push(it.slice(i, i + 3));
			});
	});
	return arr;
};

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		await connect();

		const amount = await User.countDocuments();
		info(`${amount} consent will be moved`);
		const limit = 500;
		let skip = 0;
		let looped = 0;

		while (looped < amount) {
			// ////////////////////////////////////////////////////
			// Make changes to the database here.
			// Hint: Access models via this('modelName'), not an imported model to have
			// access to the correct database connection. Otherwise Mongoose calls never return.
			info('load current amount users');
			const users = await User.find()
				.select(['firstName', 'lastName', 'email'])
				.sort({
					_id: 1,
				})
				.skip(skip)
				.limit(limit)
				.lean()
				.exec();
			looped += users.length;
			skip = looped;
			info('add index to user');
			try {
				await Promise.all(
					users.map((user) => {
						user.searchIndexes = splitForSearchIndexes(user.firstName, user.lastName, user.email);
						return user.save();
					})
				);
				info(`${looped} Users got an searchIndex array`);
			} catch (err) {
				error(`Moving Users
					between ${skip * limit}
					and ${skip * limit + limit}
					failed but will go on
					with next loop: ${err.message}`);
			}
		}

		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		await User.findOneAndUpdate(
			{
				firstName: 'Max',
				lastName: 'Mathe',
			},
			{
				firstName: 'Marla',
			}
		)
			.lean()
			.exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
