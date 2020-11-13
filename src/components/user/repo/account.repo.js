const getUserAccount = async (userId, app) => {
	const [account] = await app.service('accountModel').find({
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
		return app.service('accountModel').remove(account._id);
	}
	return null;
};

module.exports = {
	getUserAccount,
	deleteUserAccount,
};
