const { pseudonymRepo } = require('../repo/index');
const { validateObjectId } = require('../../helper/validation.helper');
const { trashBinResult } = require('../../helper/uc.helper');
const { debug } = require('../../../logger');

const deletePseudonymsForUser = async (userId) => {
	validateObjectId({ userId });
	let complete = true;
	debug(`deleting user related pseudonyms started`, { userId });
	const pseudonyms = await pseudonymRepo.getPseudonymsForUser(userId);
	debug(`found ${pseudonyms.length} pseudonyms for the user to be removed`, { userId });
	if (pseudonyms.length !== 0) {
		const result = await pseudonymRepo.deletePseudonymsForUser(userId);
		complete = result.success;
		debug(`removed  ${result.deletedDocuments} pseudonyms`, { userId });
	}
	debug(`deleting user related pseudonyms finished`, { userId });
	return trashBinResult({ scope: 'pseudonyms', data: pseudonyms, complete });
};

const deleteUserData = [deletePseudonymsForUser];

module.exports = {
	deleteUserData,
};
