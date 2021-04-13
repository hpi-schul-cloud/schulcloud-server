const accountModel = require('../../account/model');

class AccountRepo {
	constructor(app) {
		this.app = app;
	}

	create(userId, account) {
		return accountModel.create({
			userId,
			username: account.username.toLowerCase(),
			systemId: account.systemId,
			activated: true,
		});
	}

	async update(userId, account) {
		return accountModel.update(
			{ userId, systemId: account.systemId },
			{
				username: account.username,
				userId,
				systemId: account.systemId,
				activated: true,
			},
			{ upsert: true }
		);
	}
}

module.exports = AccountRepo;
