const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { Schema } = mongoose;

const { connect, close } = require('../src/utils/database');

const Submission = mongoose.model(
	'submission221128',
	new mongoose.Schema({
		grade: { type: Number, min: 0, max: 100 },
		gradeComment: { type: String },
		gradeFileIds: [{ type: Schema.Types.ObjectId, ref: 'file' }],
		submitted: { type: Boolean, default: false },
		graded: { type: Boolean, default: false },
	}),
	'submissions'
);

module.exports = {
	up: async function up() {
		await connect();
		const resultStepOne = await Submission.updateMany(
			{},
			{
				submitted: true,
				graded: false,
			}
		).exec();

		alert(`Create of key [submitted: true, graded: false] is completely: ${JSON.stringify(resultStepOne)}`);

		const resultStepTwo = await Submission.updateMany(
			{
				$or: [
					{
						$and: [{ gradeComment: { $exists: true } }, { gradeComment: { $ne: '' } }],
					},
					{
						$and: [{ grade: { $exists: true } }, { grade: { $gte: 0 } }],
					},
					{
						$and: [{ gradeFileIds: { $exists: true } }, { gradeFileIds: { $not: { $size: 0 } } }],
					},
				],
			},
			{
				graded: true,
			}
		).exec();

		alert(`Update of key [graded: true] is completely: ${JSON.stringify(resultStepTwo)}`);

		await close();
	},

	down: async function down() {
		alert(`Is nothing to rollback`);
	},
};
