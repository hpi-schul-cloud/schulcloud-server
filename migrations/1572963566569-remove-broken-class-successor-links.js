const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Klass = mongoose.model(
	'class',
	new mongoose.Schema(
		{
			successor: { type: mongoose.Schema.Types.ObjectId, ref: 'classes' },
		},
		{
			timestamps: true,
		}
	)
);

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		const classesWithSuccessor = await Klass.find({
			successor: { $exists: true },
		})
			.lean()
			.exec();

		const updatePromises = classesWithSuccessor.map((klass) =>
			Klass.findById(klass.successor)
				.lean()
				.exec()
				.then((v) => {
					if (v === null) {
						return Klass.findByIdAndUpdate(klass._id, { $unset: { successor: '' } });
					}
					return Promise.resolve();
				})
		);
		await Promise.all(updatePromises);
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		// await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		// ////////////////////////////////////////////////////
		// await close();
		info('this migration has nothing to do on DOWN');
	},
};
