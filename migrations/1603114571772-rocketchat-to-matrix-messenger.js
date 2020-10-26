/* eslint-disable no-await-in-loop */
// eslint-disable-next-line no-unused-vars
const { info, warn, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { schoolModel } = require('../src/services/school/model');

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
		const amount = await schoolModel.find({ features: 'rocketChat' }).countDocuments();
		info(`${amount} schools with rocketChat enabled found. Start migration to Matrix messenger`);
		const limit = 200;
		let looped = 0;

		while (looped < amount) {
			try {
				const schools = await schoolModel
					.find({ features: 'rocketChat' })
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
					schools.map((school) => {
						if (!school.features.find((feature) => feature === 'messenger')) {
							school.features.push('messenger');
						}
						return schoolModel.findByIdAndUpdate(school._id, { $set: { features: school.features } });
					})
				);

				looped += schools.length;
			} catch (e) {
				error('migration form rocketChat to Matrix failed');
				error(e);
			}
		}
		// ////////////////////////////////////////////////////
		info(`migrated ${looped} schools from rocketChat to Matrix messenger`);
		await close();
	},

	down: async function down() {
		warn(
			"Schools using Matrix Messenger won't be migrated back to RocketChat automatically. If you need to switch Matrix Messenger of use the instance feature flag."
		);
	},
};
