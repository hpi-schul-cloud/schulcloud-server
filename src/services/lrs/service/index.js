class LearningLockerStore {
	constructor(app) {
		this.xapi = require('request-promise-native').defaults({
			baseUrl: app.get('services').xapi,
			json: true,
			headers: {
				Authorization: app.get('xapiAuth'),
				'X-Experience-API-Version': '1.0.3'
			}
		});
	}

	find(params) {
		return new Promise((resolve, reject) => {
			this.xapi.get('/statements')
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
			this.xapi.post('/statements', {
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


}

module.exports = app => new LearningLockerStore(app);
