const MODEL_SERVICE = 'consents/mondel';

class ConsentService {
	constructor() {

	}

	setup(app) {
		this.app = app;
	}

	async find(params) {
		if (params.query.consents) {
			params.query = {};
		}

		return this.app.service(MODEL_SERVICE).find(params);
	}

	async get(_id, params) {
		return this.app.service(MODEL_SERVICE).get(_id, params);
	}

	async create(data, params) {
		return this.app.service(MODEL_SERVICE).create(data, params);
	}

	async patch(_id, data, params) {
		return this.app.service(MODEL_SERVICE).patch(_id, data, params);
	}

	async update(_id, data, params) {
		return this.app.service(MODEL_SERVICE).update(_id, data, params);
	}

	async remove(_id, params) {
		return this.app.service(MODEL_SERVICE).remove(_id, params);
	}
}

module.exports = ConsentService;
