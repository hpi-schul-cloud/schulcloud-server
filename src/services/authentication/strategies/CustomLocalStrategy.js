const { LocalStrategy } = require('@feathersjs/authentication-local');

class CustomLocalStrategy extends LocalStrategy {
	async getEntity(accountId) {
		const account = await this.app.service('nest-account-service').findById(accountId);
		return account;
	}

	async findEntity(username) {
		const { accounts } = await this.app.service('nest-account-service').searchByUsernameExactMatch(username);
		if (accounts.length > 1) {
			return accounts.find((account) => !account.systemId);
		}
		return accounts[0];
	}
}

module.exports = CustomLocalStrategy;
