const logger = require('../../../logger');
const {
	findPrivateHomeworksFromUser,
	deletePrivateHomeworksFromUser,
	findPublicHomeworksFromUser,
	replaceUserInPublicHomeworks,
	findGroupSubmissionsFromUser,
	findSingleSubmissionsFromUser,
	removeGroupSubmissionsConnectionsForUser,
	deleteSingleSubmissionsFromUser,
} = require('../repo/task.repo');

const checkStatus = (status) => {
	if (status.success !== 1) {
		// || status.count !== status.modified
		// TODO: who is really look into logs for this?
		logger.warning('User deletion task has some miss matches.', status);
	}
};

const deletePrivateSubmissions = async (userId) => {
	const result = await findSingleSubmissionsFromUser(userId);

	if (result.length > 0) {
		const status = await deleteSingleSubmissionsFromUser(userId);
		checkStatus(status);
	}

	const trashbinData = {
		scope: 'submissions',
		type: 'private',
		data: result,
	};

	// TODO: complete should from type boolean and false until it is finished by the executed instance
	return { trashbinData, complete: true };
};

const removeConnectionToSharedSubmissions = async (userId) => {
	// the location to adding the user teamMember by restore is impilict exist
	const result = await findGroupSubmissionsFromUser(userId, ['_id']);

	if (result.length > 0) {
		const status = await removeGroupSubmissionsConnectionsForUser(userId);
		checkStatus(status);
	}

	const trashbinData = {
		scope: 'submissions',
		type: 'shared',
		data: result,
	};

	return { trashbinData, complete: true };
};

const deletePrivateUserHomeworks = async (userId) => {
	const result = await findPrivateHomeworksFromUser(userId);

	if (result.length > 0) {
		const status = await deletePrivateHomeworksFromUser(userId);
		checkStatus(status);
	}

	const trashbinData = {
		scope: 'homeworks',
		type: 'private',
		data: result,
	};

	return { trashbinData, complete: true };
};

const removeConnectionToSharedHomeworks = async (userId, replaceUserId) => {
	// the location to adding the user teacherId by restore is impilict exist
	const result = await findPublicHomeworksFromUser(userId, ['_id']);

	if (result.length > 0) {
		const status = await replaceUserInPublicHomeworks(userId, replaceUserId);
		checkStatus(status);
	}

	const trashbinData = {
		scope: 'homeworks',
		type: 'shared',
		data: result,
	};

	return { trashbinData, complete: true };
};

const deleteUserRelatedData = () => [
	deletePrivateSubmissions,
	removeConnectionToSharedSubmissions,
	deletePrivateUserHomeworks,
	removeConnectionToSharedHomeworks,
];

module.exports = { deleteUserRelatedData };
