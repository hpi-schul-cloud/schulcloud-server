let createdaccountsIds = [];

// should rewrite
const createTestAccount = (appPromise) => async (accountParameters, system, user) => {
	const app = await appPromise;
	if (system) {
		accountParameters.systemId = system._id;
	}
	accountParameters.userId = user._id;
	return app
		.service('accounts')
		.create(accountParameters)
		.then((account) => {
			createdaccountsIds.push(account._id.toString());
			return account;
		});
};

const cleanup = (appPromise) => async () => {
	const app = await appPromise;
	if (createdaccountsIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdaccountsIds;
	createdaccountsIds = [];
	return ids.map((id) => app.service('accounts').remove(id));
};

module.exports = (app, opt) => ({
	create: createTestAccount(app, opt),
	cleanup: cleanup(app),
	info: createdaccountsIds,
});
