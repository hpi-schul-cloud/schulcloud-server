const replaceUserAccountWithTombstone = async (userId, app) => {
	const modelService = app.service('accountModel');
	const accounts = await modelService.find({ query: { userId } });
	const { _id, username } = accounts && accounts.length === 1 ? accounts[0] : undefined;
	if (username) {
		const deletedUsername = username && username.indexOf('DELETED_') < 0 ? `DELETED_${username}` : username;
		return modelService.patch(_id, {
			username: deletedUsername,
			deletedAt: new Date(),
		});
	}
	return Promise.resolve(true);
};

module.exports = {
	replaceUserAccountWithTombstone,
};
