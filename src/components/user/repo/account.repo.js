
const getUserAccount = async (userId, app) => {
	const [account] = await app.service('accounts').find({
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
		return app.service('accounts').remove(account._id);
	}
	return null;
};

module.exports = {
	getUserAccount,
	deleteUserAccount,
};
