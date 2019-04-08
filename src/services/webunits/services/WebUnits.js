class WebUnits {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}
	// https://docs.feathersjs.com/api/services

	find(params) {	// is get without id in url path
		// example: this.app.service('courses').find({schoolId: '123'})
		// http://localhost:3030/docs/  || https://api.schul-cloud.org/docs/
	}

	get(id, params) {

	}

	create(data, params) {

	}

	patch(id, data, params) {

	}

	/*
	update(id, data, params) {

	}

	*/

	remove(id, params) {

	}

	setup(app) {
		this.app = app;
	}
}

module.exports = WebUnits;
