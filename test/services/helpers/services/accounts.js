let createdaccountsIds = [];

// should rewrite
const createTestAccount = app => (accountParameters, system, user) => {
	if (system) {
		accountParameters.systemId = system.id;
	}
	accountParameters.userId = user._id;
	return app.service('accounts').create(accountParameters)
		.then((account) => {
			createdaccountsIds.push(account._id.toString());
			return account;
		});
};

const cleanup = app => () => {
	const ids = createdaccountsIds;
	createdaccountsIds = [];
	return ids.map(id => app.service('accounts').remove(id));
};

module.exports = (app, opt) => ({
	create: createTestAccount(app, opt),
	cleanup: cleanup(app),
	info: createdaccountsIds,
});
