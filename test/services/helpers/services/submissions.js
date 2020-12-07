const { submissionModel } = require('../../../../src/services/homework/model');

let createdSubmissions = [];

const create = (opt) => async (data) => {
	data.schoolId = data.schoolId || opt.schoolId;
	data.homeworkId = data.homeworkId || opt.generateObjectId();
	data.studentId = data.studentId || opt.generateObjectId();

	const submission = await submissionModel.create(data);
	createdSubmissions.push(submission._id);
	return submission;
};

const cleanup = () => {
	if (createdSubmissions.length === 0) {
		return Promise.resolve();
	}
	const ids = createdSubmissions;
	createdSubmissions = [];
	return submissionModel
		.deleteMany({ id: { $in: ids } })
		.lean()
		.exec();
};

module.exports = (app, opt) => ({
	create: create(opt),
	cleanup,
	info: () => createdSubmissions,
});
