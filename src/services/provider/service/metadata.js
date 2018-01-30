class ProviderService {
	constructor(opts) {
		this.options = opts;
		this.client  = null;
		this.ready   = false;
	}

	setup(app, path) {
		this.app = app;
	}

	get(id, params) {
		console.log(id, params);
		return  Promise.resolve([]);
	}
}

function service(options) {
	return new ProviderService(options);
}

module.exports = service;
