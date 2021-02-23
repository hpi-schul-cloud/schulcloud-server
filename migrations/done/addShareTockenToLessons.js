const ran = true;
const name = 'Add shareToken to lessons in shared courses';
const nanoid = require('nanoid');

const database = require('../../src/utils/database');
const { LessonModel } = require('../../src/services/lesson/model');
const { courseModel } = require('../../src/services/user-group/model');

const run = async () => {
	// Get Course and check for shareToken, if not found create one
	// Also check the corresponding lessons and add shareToken

	database.connect();

	try {
		const data = await courseModel
			.find({ shareToken: { $exists: true } })
			.lean()
			.exec();
		return Promise.all(
			data.map(async ({ _id }) => {
				const lessons = await LessonModel.find({ courseId: _id }).lean().exec();
				for (let i = 0; i < lessons.length; i += 1) {
					if (!lessons[i].shareToken) {
						await LessonModel.findByIdAndUpdate(lessons[i]._id, { shareToken: nanoid(12) });
						console.log(lessons[i]);
					}
				}
				return Promise.resolve();
			})
		);
	} catch (err) {
		console.log(err);
		return Promise.reject(err);
	}
};

module.exports = {
	ran,
	name,
	run,
};
