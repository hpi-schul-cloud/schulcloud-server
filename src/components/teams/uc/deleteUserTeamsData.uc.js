const { AssertionError } = require('../../../errors');
const { teamRepo } = require('../repo');
const { trashBinResult } = require('../../helper/uc.helper');
const { isValid: isValidObjectId } = require('../../../helper/compare').ObjectId;
const { debug } = require('../../../logger');
const assertionErrorHelper = require('../../../errors/assertionErrorHelper');

const addTeamsToTrashbinData = (teams = [], data) => {
	const userTeams = teams.map((team) => team._id);
	Object.assign(data, { teamIds: { userTeams } });
};

const validateParams = (userId) => {
	if (!isValidObjectId(userId)) throw new AssertionError(assertionErrorHelper.missingParameters({ userId }));
};

const deleteUserDataFromTeams = async (userId) => {
	validateParams(userId);
	debug(`deleting user mentions in teams started`, { userId });
	let complete = true;
	const teams = await teamRepo.getTeamsIdsForUser(userId);
	debug(`found ${teams.length} teams with user to be removed from`, { userId });
	const data = {};
	if (teams.length !== 0) {
		addTeamsToTrashbinData(teams, data);
		const result = await teamRepo.removeUserFromTeams(userId);
		complete = result.success;
		debug(`removed user from ${result.modifiedDocuments} teams`, { userId });
	}
	debug(`deleting user mentions in teams contents finished`, { userId });
	return trashBinResult({ scope: 'teams', data, complete });
};

// public
const deleteUserData = [deleteUserDataFromTeams];

module.exports = { deleteUserData };
