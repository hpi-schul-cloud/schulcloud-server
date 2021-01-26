const LessonModel = require('../../../../src/services/lesson/model');

let createdLessons = [];

const createLessonContents = ({
	user,
	component = 'text',
	title = 'a content title',
	content = {},
	hidden = false,
} = {}) => ({
	user,
	component,
	title,
	content,
	hidden,
});

const create = async ({
	name = 'testLesson',
	description = 'lorem ipsum',
	courseId = undefined,
	courseGroupId = undefined,
	contents = [],
	date = undefined,
	time = undefined,
	hidden = undefined,
	...other
}) => {
	const lesson = await LessonModel.create({
		name,
		description,
		courseId,
		courseGroupId,
		contents,
		date,
		time,
		hidden,
		...other,
	});
	createdLessons.push(lesson._id);
	return lesson;
};

const cleanup = () => {
	if (createdLessons.length === 0) {
		return Promise.resolve();
	}
	const ids = createdLessons;
	createdLessons = [];
	return LessonModel.deleteMany({ id: { $in: ids } })
		.lean()
		.exec();
};

module.exports = {
	create,
	cleanup,
	info: () => createdLessons,
	createLessonContents,
};
