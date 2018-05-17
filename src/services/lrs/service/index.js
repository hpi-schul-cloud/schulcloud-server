class LearningLockerStore {
	constructor(app) {
		this.xapi = require('request-promise').defaults({
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
			//TODO: Put in hook
			//pseudoService.find()
			//console.log(data);
			this.xapi.post('/statements', {
				body: {
					actor: {
						account: {
							name: data.actorId,
							homePage: "https://bp.schul-cloud.org/"
						},
						objectType: "Agent"
					},
					verb: {
						id: data.verbId,
						display: data.verbDisplayName,
					},
					object: {
						id: data.objectId,
						definition: {
							name: {
								de: data.objectName
							},
							description: {
								de: data.objectDescription
							}
						},
						objectType: "Activity"
					},
					context: {
						contextActivities: {
							parent: {
								id: data.courseId
							}
						}
					}
				}
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
