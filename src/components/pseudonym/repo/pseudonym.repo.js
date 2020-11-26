const { pseudonymModel } = require('../../../services/pseudonym/model');

const getPseudonymsForUser = async (userId) => {
	pseudonymModel.find({ userId }).lean().exec();
	const pseudonyms = await getService(app).find({
		query: {
			userId,
		},
		paginate: false,
	});
	return pseudonyms._id ? Array.of(pseudonyms) : pseudonyms;
};

const deletePseudonyms = async (pseudonyms, app) => {
	const removePromises = pseudonyms.map((pseudonym) => getService(app).remove(pseudonym._id));
	await Promise.all(removePromises);
};

module.exports = {
	getPseudonyms,
	deletePseudonyms,
};
