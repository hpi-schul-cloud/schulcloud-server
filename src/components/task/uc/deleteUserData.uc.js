const logger = require('../../../logger');
const {
	findPrivateHomeworksFromUser,
	deletePrivateHomeworksFromUser,
	findPublicHomeworksFromUser,
	replaceUserInPublicHomeworks,
} = require('../repo/task.repo');

const checkStatus = (status) => {
	if (status.success !== 1) {
		// TODO: who is really look into logs for this?
		logger.warning('Task step failed', status);
	}
};

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
	const result = await findPrivateHomeworksFromUser(userId);

	if (result.length > 0) {
		const status = await deletePrivateHomeworksFromUser(userId);
		checkStatus(status);
	}

	const trashbinData = {
		context: 'homeworks',
		type: 'private',
		data: result,
	};

	return { trashbinData, complete: undefined };
};

const removeConnectionToSharedHomeworks = async (userId, replaceUserId) => {
	const result = await findPublicHomeworksFromUser(userId, ['_id', 'teacherId']);

	if (result.length > 0) {
		const status = await replaceUserInPublicHomeworks(userId, replaceUserId);
		checkStatus(status);
	}

	const trashbinData = {
		context: 'homeworks',
		type: 'shared',
		data: result,
	};

	return { trashbinData, complete: undefined };
};

const deleteUserRelatedData = () => [
	deletePrivateSubmissions,
	removeConnectionToSharedSubmissions,
	deletePrivateUserHomeworks,
	removeConnectionToSharedHomeworks,
];

module.exports = deleteUserRelatedData;
