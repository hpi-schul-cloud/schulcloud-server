const { submissionModel } = require('../../../../src/services/homework/model');

let createdSubmissions = [];

const create = (opt) => (async (data) => {
	data.schoolId = data.schoolId || opt.schoolId;
	if (!data.homeworkId || !data.studentId) {
		throw new Error('testSubmission requires a homework and student id!');
	}
	const homework = await submissionModel.create(data);
	createdSubmissions.push(homework._id);
	return homework;
});

const cleanup = () => {
	if (createdSubmissions.length === 0) {
		return Promise.resolve();
	}
	const ids = createdSubmissions;
	createdSubmissions = [];
	return submissionModel.deleteMany({ id: { $in: ids } }).lean().exec();
};

module.exports = (app, opt) => ({
	create: create(opt),
	cleanup,
	info: () => createdSubmissions,
});
