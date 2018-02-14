const xapi = require('../../../xapi.js');

class LearningLockerStore {
	constructor(opts) {
		this.options = opts;
		this.app	 = null;
	}

	find(params) {
		return new Promise((resolve, reject) => {
			xapi(this.app).get('/statements')
				.then(statements => {
					resolve(statements);
				})
				.catch(response => {
					resolve(response);
				})
		})
	}

	create(data) {
		return new Promise((resolve, reject) => {
			xapi(this.app).post('/statements', {
				body: data
			})
			.then(result => {
				resolve(result);
			})
			.catch(response => {
				resolve(response);
			});
		});
	}

	setup(app, path) {
		this.app = app;
	}
}

function service(opts) {
	return new LearningLockerStore(opts);
}

module.exports = service;
