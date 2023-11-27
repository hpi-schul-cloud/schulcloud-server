module.exports = async (app, user) => {
	if (user.source) return true;
	const userId = user._id ? user._id.toString() : user.toString();
	const account = await app.service('nest-account-service').findByUserId(userId);
	return !!account.systemId;
};
