
const getService = (app) => {
	return app.service('accountModel');
};

const getUserAccount = async (userId, app) => {
	const [account] = await getService(app).find({
		query: {
			userId,
			$limit: 1,
		},
		paginate: false,
	});
	return account;
};

const deleteUserAccount = async (account, app) => {
	return getService(app).remove(account._id);
};

module.exports = {
	getUserAccount,
	deleteUserAccount,
};
