const { UserRepo } = require('../repo');

class UserAccountService {
	constructor(options) {
		this.options = options || {};
	}

	async setup(app) {
		this.app = app;
	}

	async createUserAndAccount(inputUser, inputAccount) {
		const user = await UserRepo.createUser(inputUser);
		inputAccount.userId = user._id;

		const account = await this.createAccount(inputAccount);
		return { user, account };
	}

	async updateUserAndAccount(userId, changedUser, changedAccount) {
		const user = await UserRepo.updateUser(userId, changedUser);
		const account = await this.updateAccount(user._id, changedAccount);
		return { user, account };
	}

	async createAccount(account) {
		return this.app.service('nest-account-service').save({
			userId: account.userId,
			username: account.username.toLowerCase(),
			systemId: account.systemId,
			activated: true,
		});
	}

	async updateAccount(userId, account) {
		const nestAccountService = await this.app.service('nest-account-service');
		// const createdAccount = await nestAccountService.findByUsernameAndSystemId(username, account.systemId);
		const createdAccount = await nestAccountService.findByUserId(userId);
		createdAccount.username = account.username;
		createdAccount.activated = true;
		nestAccountService.save(createdAccount);
	}
}

module.exports = UserAccountService;
