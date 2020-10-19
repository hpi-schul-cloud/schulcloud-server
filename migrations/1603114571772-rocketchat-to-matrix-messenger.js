/* eslint-disable no-await-in-loop */
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

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
					school.features = school.features.filter((feature) => feature !== 'rocketChat');
					if (!school.features.find((feature) => feature === 'messenger')) {
						school.features.push('messenger');
					}
					return schoolModel.findByIdAndUpdate(school._id, school);
				})
			);

			looped += schools.length;
		}
		// ////////////////////////////////////////////////////
		info(`migrated ${looped} schools from rocketChat to Matrix messenger`);
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		const amount = await schoolModel.find({ features: 'messenger' }).countDocuments();
		info(`${amount} schools with Matrix messenger enabled found. Start migration to rocketChat`);
		const limit = 200;
		let looped = 0;

		while (looped < amount) {
			const schools = await schoolModel
				.find({ features: 'messenger' })
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
					school.features = school.features.filter((feature) => feature !== 'messenger');
					if (!school.features.find((feature) => feature === 'rocketChat')) {
						school.features.push('rocketChat');
					}
					return schoolModel.findByIdAndUpdate(school._id, school);
				})
			);

			looped += schools.length;
		}
		// ////////////////////////////////////////////////////
		info(`migrated ${looped} schools from Matrix messenger to RocketChat`);
		await close();
	},
};
