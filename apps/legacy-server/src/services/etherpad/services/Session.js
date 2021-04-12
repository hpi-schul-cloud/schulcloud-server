class Session {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	create(params) {
		return Promise.resolve({
			code: 0,
			message: 'ok',
			data: {
				sessionID: params.sessionID,
				validUntil: params.validUntil,
			},
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Session;
