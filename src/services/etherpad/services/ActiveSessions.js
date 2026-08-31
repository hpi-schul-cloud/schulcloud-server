class ActiveSessions {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	async get(params) {
		return Promise.resolve({
			code: 0,
			message: 'ok',
			data: {
				sessionIDs: params.sessionIDs,
			},
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = ActiveSessions;
