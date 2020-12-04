const { SubmissionModel, HomeworkModel } = require('../db');

const privateHomeworkQuery = (userId) => ({ private: true, teacherId: userId });

const findPrivateHomeworksFromUser = async (userId, select) => {
	const result = await HomeworkModel.find(privateHomeworkQuery(userId), select).lean().exec();
	return result;
};

const deletePrivateHomeworksFromUser = async (userId) => {
	const result = await HomeworkModel.deleteMany(privateHomeworkQuery(userId)).lean().exec();
	const success = result.ok === 1 && result.n === result.deletedCount;
	// TODO it sound bad to not give feedback over which ressources are deleted. A list of deleted _ids are also nice in this situation.
	return success;
};

module.exports = {
	findPrivateHomeworksFromUser,
	deletePrivateHomeworksFromUser,
};
