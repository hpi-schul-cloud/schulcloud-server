const xapi = require('../../../xapi.js');

class LearningLockerStore {
	constructor(opts) {
		this.options = opts;
		this.app	 = null;
	}

	find(params) {
		return new Promise((resolve, reject) => {
			console.log("getting data from lrs");

			xapi(this.app).get('/statements')
				.then(statements => {
					console.log(statements);
					resolve(statements);
				})
				.catch(response => {
					resolve(response);
				})
		})
	}

	create(data, params) {
		return new Promise((resolve, reject) => {

			const feedback = this.app.service("feedback");

			const feedback_key = data.feedback_key;

			feedback.get(feedback_key)
				.then(user => {
					const xapi = data.xapi;


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
