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
			const client = app.get("redis");
			const feedback_key = data.feedback_key;

			client.get("token-" + feedback_key, (err, res) => {
				if(err) reject(err);

				if(res) {
					const user = JSON.parse(res);
				}
			})
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
