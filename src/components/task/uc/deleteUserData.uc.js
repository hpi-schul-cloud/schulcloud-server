const taskRepo = require('../repo/task.repo');

const { trashBinResult } = require('../../helper/uc.helper');

const { validateObjectId } = require('../../helper/validation.helper');

const addSubmissionToData = (submissions, data) => {};

const addPrivateHomeworksToData = (privateHomeworks, data) => {};

const deletePrivateSubmissions = async (userId) => {
	validateObjectId(userId);
	const result = await taskRepo.findSingleSubmissionsByUser(userId);
	const data = [];
	let complete = true;
	if (result.length > 0) {
		data.push(...result);
		const status = await taskRepo.deleteSingleSubmissionsFromUser(userId);
		complete = status.success;
	}

	return trashBinResult({ scope: 'submissions-private', data, complete });
};

const removeConnectionToSharedSubmissions = async (userId) => {
	validateObjectId(userId);
	// the location to adding the user teamMember by restore is impilict exist
	const result = await taskRepo.findGroupSubmissionIdsByUser(userId);
	let complete = true;
	if (result.length > 0) {
		const status = await taskRepo.removeGroupSubmissionsConnectionsForUser(userId);
		complete = status.success;
	}

	return trashBinResult({ scope: 'submissions-shared', data: result, complete });
};

const deletePrivateUserHomeworks = async (userId) => {
	validateObjectId(userId);
	const result = await taskRepo.findPrivateHomeworksByUser(userId);
	let complete = true;
	const data = [];
	if (result.length > 0) {
		const status = await taskRepo.deletePrivateHomeworksFromUser(userId);
		complete = status.success;
		data.push(...result);
		addPrivateHomeworksToData(result, data);
	}

	return trashBinResult({ scope: 'homeworks-private', data, complete });
};

const removeConnectionToSharedHomeworks = async (userId, replaceUserId) => {
	validateObjectId(userId);
	validateObjectId(replaceUserId);
	// the location to adding the user teacherId by restore is impilict exist
	const result = await taskRepo.findPublicHomeworkIdsByUser(userId);
	let complete = true;

	if (result.length > 0) {
		const status = await taskRepo.replaceUserInPublicHomeworks(userId, replaceUserId);
		complete = status.success;
	}

	return trashBinResult({ scope: 'homeworks-shared', data: result, complete });
};

const removeConnectionToArchivedHomeworks = async (userId, replaceUserId) => {
	validateObjectId(userId);
	validateObjectId(replaceUserId);
	const result = await taskRepo.findArchivedHomeworkIdsByUser(userId);
	let complete = true;

	if (result.length > 0) {
		const status = await taskRepo.replaceUserInArchivedHomeworks(userId, replaceUserId);
		complete = status.success;
	}

	return trashBinResult({ scope: 'homeworks-archived', data: result, complete });
};

const deleteUserRelatedData = () => [
	deletePrivateSubmissions,
	removeConnectionToSharedSubmissions,
	deletePrivateUserHomeworks,
	removeConnectionToSharedHomeworks,
	removeConnectionToArchivedHomeworks,
];

module.exports = { deleteUserRelatedData };
