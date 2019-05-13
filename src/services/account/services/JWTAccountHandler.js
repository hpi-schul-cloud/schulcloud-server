class JWTAccountHandler {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
		//	this.app = options.app;
	}

	get(id, params) {
		const accountId = id || params.route.accountId;
		return this.app.service('accounts').get(accountId, {
			query: {
				$populate: [
					{
						path: 'userId',
						populate: { path: 'roles' },
					},
				],
			},
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = JWTAccountHandler;
