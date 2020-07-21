module.exports = async (app, user) => {
	if (user.source) return true;
	const accounts = await app.service('/accounts').find({
		query: {
			userId: user._id,
		},
	});
	return accounts.some((account) => !!account.systemId);
};
