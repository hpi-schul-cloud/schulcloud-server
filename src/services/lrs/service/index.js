const request = require("request-promise-native");

class LearningLockerStore {
	constructor(opts) {
		this.options = opts;
		this.app	 = null;
	}

	get(params) {
		//TODO
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
