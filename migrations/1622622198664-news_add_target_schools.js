const mongoose = require('mongoose');
const { newsSchema } = require('../src/services/news/model');

const { connect, close } = require('../src/utils/database');

const News = mongoose.model('news34838583553', newsSchema, 'news');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		const newsSchools = await News.distinct('schoolId', { targetModel: null }).lean().exec();
		await Promise.all(
			newsSchools.map((school) =>
				News.updateMany({ schoolId: school, targetModel: null }, { targetModel: 'schools', target: school })
					.lean()
					.exec()
			)
		);

		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		await News.updateMany({ targetModel: 'schools' }, { targetModel: null, target: null }).lean().exec();
		await close();
	},
};
