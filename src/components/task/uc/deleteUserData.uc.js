const { findPrivateHomeworksFromUser, deletePrivateHomeworksFromUser } = require('../repo/task.repo');

// TODO
const deletePrivateSubmissions = async (userId) => {
	// TODO
	return {
		context: 'submissions',
		type: 'private',
		data: [],
	};
};

const removeConnectionToSharedSubmissions = async (userId) => {
	// TODO
	return {
		context: 'submissions',
		type: 'shared',
		data: [],
	};
};

const deletePrivateUserHomeworks = async (userId) => {
	// TODO
	const result = await findPrivateHomeworksFromUser(userId);
	const execute = await deletePrivateHomeworksFromUser(userId);

	return {
		context: 'homeworks',
		type: 'private',
		data: result,
		success: execute.success,
	};
};

const removeConnectionToSharedHomeworks = async (userId) => {
	// TODO
	return {
		context: 'homeworks',
		type: 'shared',
		data: [],
	};
};

const deleteUserRelatedData = async (userId) => {
	// TODO Promise.all
	const privateSubmissions = await deletePrivateSubmissions(userId);
	const sharedSubmissions = await removeConnectionToSharedSubmissions(userId);
	const privateHomeworks = await deletePrivateUserHomeworks(userId);
	const sharedHomeworks = await removeConnectionToSharedHomeworks(userId);
	// TODO clearify the latest conclusio array, or object ..but is the array matched in user to object then array make no sense
	return [privateSubmissions, sharedSubmissions, privateHomeworks, sharedHomeworks];
};

module.exports = {
	deleteUserRelatedData,
};
