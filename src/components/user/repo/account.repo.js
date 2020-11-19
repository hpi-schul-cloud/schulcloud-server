
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

const deleteUserAccount = async (userId, app) => {
	const account = await getUserAccount(userId, app);
	if (account && account._id) {
		return getService(app).remove(account._id);
	}
	return null;
};

module.exports = {
	getUserAccount,
	deleteUserAccount,
};
