const Pseudonym = require('../../../services/pseudonym/model');
const { GeneralError } = require('../../../errors');

const getPseudonymsForUser = async (userId) => {
	return Pseudonym.find({ userId }).lean().exec();
};

const deletePseudonyms = async (pseudonymIds) => {
	const deleteResult = await Pseudonym.deleteMany({
		_id: {
			$in: pseudonymIds,
		},
	})
		.lean()
		.exec();
	if (deleteResult.n !== deleteResult.ok || deleteResult.ok !== pseudonymIds.length) {
		throw new GeneralError('db error during deleting pseudonyms');
	}
	return pseudonymIds;
};

module.exports = {
	getPseudonymsForUser,
	deletePseudonyms,
};
