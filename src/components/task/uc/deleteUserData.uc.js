const reqlib = require('app-root-path').require;

const { DeletedUserDataError } = reqlib('src/errors');
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

const deletePrivateUserHomeworks = async (userId, context) => {
	// TODO
	const result = await findPrivateHomeworksFromUser(userId);
	const execute = await deletePrivateHomeworksFromUser(userId);

	const status = {
		context: 'homeworks',
		type: 'private',
		data: result,
		success: execute.success,
	};
	context.push(status);
	return status;
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
	const context = [];
	try {
		const privateSubmissions = await deletePrivateSubmissions(userId, context);
		const sharedSubmissions = await removeConnectionToSharedSubmissions(userId, context);
		const privateHomeworks = await deletePrivateUserHomeworks(userId, context);
		const sharedHomeworks = await removeConnectionToSharedHomeworks(userId, context);
		// TODO clearify the latest conclusio array, or object ..but is the array matched in user to object then array make no sense
		return context;
	} catch (err) {
		// must include which steps failed, otherwise it can not handle
		throw new DeletedUserDataError('Delete user related data from task failed.', err, context);
	}
};

module.exports = {
	deleteUserRelatedData,
};
