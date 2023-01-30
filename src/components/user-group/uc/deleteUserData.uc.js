const { AssertionError } = require('../../../errors');
const { classesRepo, teamsRepo } = require('../repo/index');
const { trashBinResult } = require('../../helper/uc.helper');
const { isValid: isValidObjectId } = require('../../../helper/compare').ObjectId;
const { debug } = require('../../../logger');
const assertionErrorHelper = require('../../../errors/assertionErrorHelper');

const validateParams = (userId) => {
	if (!isValidObjectId(userId)) throw new AssertionError(assertionErrorHelper.missingParameters({ userId }));
};

const addClassesToTrashbinData = (classes = [], data) => {
	const student = classes.filter((classItem) => classItem.student).map((classItem) => classItem._id);
	const teacher = classes.filter((classItem) => classItem.teacher).map((classItem) => classItem._id);
	Object.assign(data, { classIds: { student, teacher } });
};

const deleteUserDataFromClasses = async (userId) => {
	validateParams(userId);
	debug(`deleting user mentions in classes contents started`, { userId });
	let complete = true;
	const classes = await classesRepo.getClassesForUser(userId);
	debug(`found ${classes.length} classes with contents of given user to be removed`, { userId });
	const data = {};
	if (classes.length !== 0) {
		addClassesToTrashbinData(classes, data);
		const result = await classesRepo.removeUserFromClasses(userId);
		complete = result.success;
		debug(`removed user from ${result.modifiedDocuments} classes`, { userId });
	}
	debug(`deleting user mentions in classes contents finished`, { userId });
	return trashBinResult({ scope: 'classes', data, complete });
};

const addTeamsToTrashbinData = (teams = [], data) => {
	const userTeams = teams.map((team) => team._id);
	Object.assign(data, { teamIds: { userTeams } });
};

const deleteUserDataFromTeams = async (userId) => {
	validateParams(userId);
	debug(`deleting user mentions in teams started`, { userId });
	const teams = await teamsRepo.getTeamsIdsForUser(userId);
	debug(`found ${teams.length} teams with user to be removed from`, { userId });
	const data = {};
	if (teams.length !== 0) {
		addTeamsToTrashbinData(teams, data);
		const result = await teamsRepo.removeUserFromTeams(userId);
		debug(`removed user from ${result.modifiedDocuments} teams`, { userId });
	}
	debug(`deleting user mentions in teams contents finished`, { userId });
};

// public
const deleteUserData = [deleteUserDataFromClasses, deleteUserDataFromTeams];

module.exports = { deleteUserData };
