/* eslint-disable no-await-in-loop */
const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const User = mongoose.model(
	'addSearchValuesToUserNameAndEmail',
	new mongoose.Schema(
		{
			firstName: { type: String, required: true },
			firstNameSearchValues: { type: mongoose.Schema.Types.Array },
			lastName: { type: String, required: true },
			lastNameSearchValues: { type: mongoose.Schema.Types.Array },
			email: { type: String, required: true, lowercase: true },
			emailSearchValues: { type: mongoose.Schema.Types.Array },
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
		item.split(/[\s-]/g).forEach((it) => {
			if (it.length === 0) return;

			arr.push(it.slice(0, 1));
			if (it.length > 1) arr.push(it.slice(0, 2));
			for (let i = 0; i < it.length - 2; i += 1) arr.push(it.slice(i, i + 3));
		});
	});
	return arr;
};

module.exports = {
	up: async function up() {
		await connect();
		/// ///////////////////
		/// Implementation

		const amount = await User.countDocuments();
		info(`${amount} users will be updated`);
		const limit = 250;
		let skip = 0;
		let looped = 0;

		while (looped < amount) {
			info('load current amount users');
			const users = await User.find()
				.select(['firstName', 'lastName', 'email'])
				.sort({
					_id: 1,
				})
				.skip(skip)
				.limit(limit)
				.exec();
			looped += users.length;
			skip = looped;
			info('add index to user');
			try {
				await Promise.all(
					users.map((user) => {
						user.firstNameSearchValues = splitForSearchIndexes(user.firstName);
						user.lastNameSearchValues = splitForSearchIndexes(user.lastName);
						user.emailSearchValues = splitForSearchIndexes(user.email);
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
		info('removing search indexes from user');
		await User.updateMany(
			{},
			{
				$unset: {
					firstNameSearchValues: '',
					lastNameSearchValues: '',
					emailSearchValues: '',
				},
			}
		).exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
