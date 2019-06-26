const { BadRequest } = require('@feathersjs/errors');

const skipRegistration = (id, data, params) => {
	return Promise.resolve();
}

class SkipRegistrationService {
	constructor() {
		this.docs = {};
	}

	patch(id, data, params) {
		return skipRegistration(id, data, params);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = SkipRegistrationService;
