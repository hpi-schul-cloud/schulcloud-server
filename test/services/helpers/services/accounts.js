let createdaccountsIds = [];

// should rewrite
const createTestAccount = (appPromise) => async (accountParameters, system, user) => {
	const app = await appPromise;
	if (system) {
		accountParameters.systemId = system._id;
	}
	accountParameters.userId = user._id;

	const accountService = await app.service('nest-account-service');

	const accountDto = {
		username: accountParameters.username,
		password: accountParameters.password,
		token: accountParameters.token,
		credentialHash: accountParameters.credentialHash,
		userId: accountParameters.userId,
		systemId: accountParameters.systemId,
		lasttriedFailedLogin: accountParameters.lasttriedFailedLogin,
		expiresAt: accountParameters.expiresAt,
		activated: accountParameters.activated,
	};
	const createdAccount = await accountService.save(accountDto);
	createdaccountsIds.push(createdAccount.id.toString());
	return {
		...createdAccount.getProps(),
	};
};

const cleanup = (appPromise) => async () => {
	const app = await appPromise;
	if (createdaccountsIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdaccountsIds;
	createdaccountsIds = [];
	const accountService = await app.service('nest-account-service');
	for (const id of ids) {
		// eslint-disable-next-line no-await-in-loop
		await accountService.delete(id);
	}
	return Promise.resolve();
};

module.exports = (app, opt) => ({
	create: createTestAccount(app, opt),
	cleanup: cleanup(app),
	info: createdaccountsIds,
});
