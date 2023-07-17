const { missingParameters } = require('../../../errors/assertionErrorHelper');
const { teamsModel } = require('../../../services/teams/model');
const { AssertionError } = require('../../../errors');
const { isValid: isValidObjectId, toString: idToString } = require('../../../helper/compare').ObjectId;
const { updateManyResult } = require('../../helper/repo.helper');

const validateRemoveUserFromTeamsParams = (userId) => {
	if (!isValidObjectId(userId)) throw new AssertionError(missingParameters({ userId }));
};

const filterTeamsMember = (userId) => ({"userIds.userId": {$in: [userId]}});

const teamsIdWithUserProjection2BO = ({ _id }) => ({
	_id,
	id: idToString(_id),
});

/**
 * Returns a list of teams Ids with the user role plays in it
 * @param {String|ObjectId} userId - the user's to check
 * @returns: {Array} An array of result objects
 */
const getTeamsIdsForUser = async (userId) => {
	const result = await teamsModel
		.aggregate([
			{ $match: filterTeamsMember(userId) },
			{
				$project: {
					_id: true
				},
			},
		])
		.exec();

	return result.map(teamsIdWithUserProjection2BO);
};

/**
 * Removes the user for all teams he/she belongs to
 * @param {String|ObjectId} userId - the user's Id
 * @returns: {Object} Update Many Result Object
 */
const removeUserFromTeams = async (userId) => {
	validateRemoveUserFromTeamsParams(userId);
	const filter = filterTeamsMember(userId);
	const updateResult = await teamsModel.updateMany(filter, { $pull: { userIds: { userId } } }).exec();

	return updateManyResult(updateResult);
};

module.exports = {
	getTeamsIdsForUser,
	removeUserFromTeams,
};
