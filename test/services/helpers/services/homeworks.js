const { homeworkModel } = require('../../../../src/services/homework/model');

let createdHomeworks = [];

const create = (opt) => async (data) => {
	data.schoolId = data.schoolId || opt.schoolId;
	data.name = data.name || 'testHomework';
	data.availableDate = data.availableDate || new Date();
	data.teacherId = data.teacherId || opt.generateObjectId();
	data.private = data.private || null;

	const homework = await homeworkModel.create(data);
	createdHomeworks.push(homework._id);
	return homework;
};

const cleanup = () => {
	if (createdHomeworks.length === 0) {
		return Promise.resolve();
	}
	const ids = createdHomeworks;
	createdHomeworks = [];
	return homeworkModel
		.deleteMany({ id: { $in: ids } })
		.lean()
		.exec();
};

module.exports = (app, opt) => ({
	create: create(opt),
	cleanup,
	info: () => createdHomeworks,
});
