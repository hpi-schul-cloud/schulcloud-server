const { RequestContext } = require('@mikro-orm/core');
const { Semaphore } = require('async-mutex');
const { UserRepo } = require('../repo');

class UserAccountService {
	setup(app) {
		this.app = app;
		this.lock = new Semaphore(5);
	}

	// Feathers 5: at least one standard service method must be implemented to be considered a service
	get() {
		return undefined;
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
		return this.lock.runExclusive(async () =>
			RequestContext.createAsync(this.app.service('nest-orm').em, async () => {
				const newAccountData = {
					userId: account.userId,
					username: account.username.toLowerCase(),
					systemId: account.systemId,
					activated: true,
				};
				return this.app.service('nest-account-service').save(newAccountData);
			})
		);
	}

	async updateAccount(userId, account) {
		return this.lock.runExclusive(async () =>
			RequestContext.createAsync(this.app.service('nest-orm').em, async () => {
				const nestAccountService = this.app.service('nest-account-service');
				const createdAccount = await nestAccountService.findByUserId(userId);
				createdAccount.username = account.username.toLowerCase();
				createdAccount.activated = true;
				return this.app.service('nest-account-service').save(createdAccount);
			})
		);
	}
}

module.exports = UserAccountService;
