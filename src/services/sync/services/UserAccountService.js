const { RequestContext } = require('@mikro-orm/core');
const { UserRepo } = require('../repo');

class UserAccountService {
	constructor(options) {
		this.options = options || {};
	}

	async setup(app) {
		this.app = app;
	}

	async createUserAndAccount(inputUser, inputAccount, school) {
		const user = await UserRepo.createUser(inputUser, school);
		inputAccount.userId = user._id;

		try {
			const account = await this.createAccount(inputAccount);
			return { user, account };
		} catch (err) {
			await UserRepo.deleteUser(user._id);
			throw err;
		}
	}

	async updateUserAndAccount(userId, changedUser, changedAccount) {
		const user = await UserRepo.updateUser(userId, changedUser);
		const account = await this.updateAccount(user._id, changedAccount);
		return { user, account };
	}

	async createAccount(account) {
		return RequestContext.createAsync(this.app.service('nest-orm').em, async () => {
			const newAccountData = {
				userId: account.userId,
				username: account.username,
				systemId: account.systemId,
				activated: true,
			};
			return this.app.service('nest-account-service').save(newAccountData);
		});
	}

	async updateAccount(userId, account) {
		return RequestContext.createAsync(this.app.service('nest-orm').em, async () => {
			const nestAccountService = this.app.service('nest-account-service');
			const createdAccount = await nestAccountService.findByUserId(userId);
			createdAccount.username = account.username;
			createdAccount.activated = true;
			return this.app.service('nest-account-service').save(createdAccount);
		});
	}
}

module.exports = UserAccountService;
