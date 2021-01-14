const { pseudonymRepo } = require('../repo/index');

const getPseudonymsForUser = async (userId) => {
	return pseudonymRepo.getPseudonymsForUser(userId);
};

const deletePseudonyms = async (pseudonymsIds) => {
	return pseudonymRepo.deletePseudonyms(pseudonymsIds);
};

module.exports = {
	getPseudonymsForUser,
	deletePseudonyms,
};
