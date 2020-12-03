const { SubmissionModel, HomeworkModel } = require('../db');

const privateHomeworkQuery = (userId) => ({ private: true, teacherId: userId });

const findPrivateHomeworksFromUser = async (userId) => {
	const result = await HomeworkModel.find(privateHomeworkQuery(userId)).lean().exec();
	return result;
};

const deletePrivateHomeworksFromUser = async (userId) => {
	const result = await HomeworkModel.deleteMany(privateHomeworkQuery(userId)).lean().exec();
	const success = result.ok === 1 && result.n === result.nModified;
	return success;
};

module.exports = {
	findPrivateHomeworksFromUser,
	deletePrivateHomeworksFromUser,
};
