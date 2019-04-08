const rp = require('request-promise-native')
const DEFAULT_BASE_URL = "https://nexboard.nexenio.com/portal/api/v1/public/"

class Nexboard {
	constructor(apiKey, userID, url) {
		this.apiKey = apiKey
		this.user = userID
		this.url = url ? url : DEFAULT_BASE_URL
	}

	getProject(projectId) {
		let settings = {
			method: "GET",
			uri: this.url + "projects/" + projectId,
			qs: {
				token: this.apiKey,
				userId: this.user,
			},
			json: true,
		}

		return rp(settings)
			.then(res => {
				return res
			})
			.catch(err => {
				return Promise.reject(
					"Could not retrieve Project - " + err.error.msg,
				)
			})
	}

	getProjectsIds() {
		let settings = {
			method: "GET",
			uri: this.url + "projects",
			qs: {
				userId: this.user,
				token: this.apiKey,
			},
			json: true,
		}

		return new Promise((resolve, reject) => {
			rp(settings)
				.then(res => {
					return resolve(res.map(e => {
						return e.id
					}))
				})
				.catch(err => {
					return reject(
						"Could not retrieve ProjectIds - " + err.response.body.msg,
					)
				})
		})
	}

	createProject(title, description) {
		let settings = {
			method: "POST",
			uri: this.url + "projects",
			qs: {
				token: this.apiKey,
				userId: this.user
			},
			body: {
				title: title,
				description: description,
			},
			headers: { "Content-Type": "application/json" },
			json: true,
		}

		return new Promise((resolve, reject) => {
			rp(settings)
				.then(res => {
					return resolve(res)
				})
				.catch(err => {
					console.error('err :', err);
					return reject(
						"Could not create new Project - " + err.error.msg,
					)
				})
		})
	}

	getBoardsByProject(project) {
		let settings = {
			method: "GET",
			uri: this.url + "projects/" + project + "/boards",
			qs: {
				userId: this.user,
				token: this.apiKey,
			},
			json: true,
		}

		return rp(settings)
			.then(res => {
				return res
			})
			.catch(err => {
				return Promise.reject(
					"Could not retrieve Boards from Projcet - " + err.error.msg,
				)
			})
	}

	getBoard(boardId) {
		let settings = {
			method: "GET",
			uri: this.url + "boards/" + boardId,
			qs: {
				token: this.apiKey,
				userId: this.user,
			},
			json: true,
		}

		return rp(settings)
			.then(res => {
				return res
			})
			.catch(err => {
				return Promise.reject(
					"Could not retrieve Board - " + err.error.msg,
				)
			})
	}

	createBoard(title, description, project, email = 'schulcloud') {
		let settings = {
			method: "POST",
			uri: this.url + "boards",
			qs: {
				token: this.apiKey,
			},
			body: {
				title: title,
				description: description,
				email: email,
				projectId: project,
			},
			headers: { "Content-Type": "application/json" },
			json: true,
		}

		return new Promise((resolve, reject) => {
			rp(settings)
				.then(res => {
					return resolve(res)
				})
				.catch(err => {
					console.error(err)
					return reject(
						"Could not create a new Board - " + err.error.msg,
					)
				})
		})
	}
}

module.exports = new Nexboard(
	process.env.NEXBOARD_API_KEY,
	process.env.NEXBOARD_USER_ID,
)