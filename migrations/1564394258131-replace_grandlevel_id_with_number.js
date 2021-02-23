const mongoose = require('mongoose');

const { Schema } = mongoose;
const { connect, close } = require('../src/utils/database');
const { gradeLevelModel } = require('../src/services/school/model');

const NewClass = mongoose.model(
	'newClass',
	{
		teacherIds: [{ type: Schema.Types.ObjectId, ref: 'user', required: true }],
		invitationLink: { type: String },
		name: { type: String, required: false },
		year: { type: Schema.Types.ObjectId, ref: 'year' },
		gradeLevel: { type: Number, required: false },
		ldapDN: { type: String },
	},
	'classes'
);

const GradeLevel = mongoose.model('gradelevels', {
	name: { type: String },
});

const OldClass = mongoose.model(
	'oldClass',
	{
		teacherIds: [{ type: Schema.Types.ObjectId, ref: 'user', required: true }],
		invitationLink: { type: String },
		name: { type: String, required: false },
		year: { type: Schema.Types.ObjectId, ref: 'year' },
		nameFormat: { type: String, enum: ['static', 'gradeLevel+name'], default: 'static' },
		gradeLevel: { type: Schema.Types.ObjectId, ref: 'gradeLevel' },
		ldapDN: { type: String },
	},
	'classes'
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

		const data = await OldClass.find({
			nameFormat: 'gradeLevel+name',
		})
			.select(['_id', 'gradeLevel'])
			.lean()
			.exec();

		await Promise.all(
			data.map(async (element) => {
				let newGradeLevel;
				if (typeof element.gradeLevel === 'number') {
					newGradeLevel = element.gradeLevel;
				} else {
					const gradeLevel = await GradeLevel.findOne(element.gradeLevel);
					newGradeLevel = gradeLevel.name;
				}
				return NewClass.update(
					{
						_id: element._id,
					},
					{
						gradeLevel: newGradeLevel,
					}
				);
			})
		);

		await OldClass.updateMany(
			{},
			{
				$unset: { nameFormat: '' },
			}
		);

		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.

		const data = await NewClass.find({
			gradeLevel: { $exist: true },
		})
			.select('_id gradeLevel')
			.lean()
			.exec();

		await data.map(async (element) => {
			const grand = await gradeLevelModel
				.findOne({
					name: element.gradeLevel,
				})
				.lean()
				.exec();
			return OldClass.update(
				{
					_id: element._id,
				},
				{
					nameFormat: 'gradeLevel+name',
					gradeLevel: grand._id,
				}
			);
		});

		// ////////////////////////////////////////////////////
		await close();
	},
};
