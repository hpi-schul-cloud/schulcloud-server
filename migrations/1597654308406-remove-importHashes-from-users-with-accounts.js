const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');
const { userModel } = require('../src/services/user/model/index');
const accountModel = require('../src/services/account/model');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		const amount = await userModel.find({ importHash: { $ne: null } }).countDocuments();
		info(`${amount} user.importHashs found. Will check these users for accounts`);
		const limit = 200;
		let looped = 0;
		let removedImportHashes = 0;

		while (looped < amount) {
			const users = await userModel
				.find({ importHash: { $ne: null } })
				.sort({
					updatedAt: 1,
					createdAt: 1,
				})
				.skip(looped)
				.limit(limit)
				.lean()
				.exec();
			// eslint-disable-next-line no-loop-func
			await Promise.all(
				users.map((user) =>
					accountModel
						.find({ userId: user._id })
						.countDocuments()
						.then((accounts) => {
							if (accounts > 0) {
								user.importHash = null;
								removedImportHashes += 1;
								return userModel.findByIdAndUpdate(user._id, user);
							}
							return Promise.resolve();
						})
				)
			);

			looped += users.length;
		}
		// ////////////////////////////////////////////////////
		info(`removed the import hash from ${removedImportHashes} users`);
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		error("It is impossible to roleback the removal of the user's importHashes");
		// ////////////////////////////////////////////////////
		await close();
	},
};
