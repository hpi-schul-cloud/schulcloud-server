module.exports = class AccountRepo {
	setup(app) {
		this.service = app.service('accounts');
	}

	async getUserAccount(userId) {
		const [account] = await this.service.find({
			query: {
				userId,
				$limit: 1,
			},
			paginate: false,
		});
		return account;
	}

	async deleteUserAccount(userId) {
		const account = await this.getUserAccount(userId);
		if (account && account._id) {
			return this.service.remove(account._id);
		}
		return null;
	}
};

