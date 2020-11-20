const getService = (app) => {
	return app.service('pseudonymModel');
};

const getPseudonyms = async (userId, app) => {
	const pseudonyms = await getService(app).find({
		query: {
			userId,
		},
		paginate: false,
	});
	return pseudonyms._id ? Array.of(pseudonyms) : pseudonyms;
};

const deletePseudonyms = async (pseudonyms, app) => {
	pseudonyms.forEach((pseudonym) => getService(app).remove(pseudonym._id));
};

module.exports = {
	getPseudonyms,
	deletePseudonyms,
};
