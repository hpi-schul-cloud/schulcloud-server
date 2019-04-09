const rp = require('request-promise-native');

const DEFAULT_BASE_URL = 'https://nexboard.nexenio.com/portal/api/v1/public/';

class Nexboard {
	constructor(apiKey, userID, url) {
		this.apiKey = apiKey;
		this.user = userID;
		this.url = url || DEFAULT_BASE_URL;
	}

	getProject(projectId) {
		const settings = {
			method: 'GET',
			uri: `${this.url}projects/${projectId}`,
			qs: {
				token: this.apiKey,
				userId: this.user,
			},
			json: true,
		};

		return rp(settings);
	}

	getProjectsIds() {
		const settings = {
			method: 'GET',
			uri: `${this.url}projects`,
			qs: {
				userId: this.user,
				token: this.apiKey,
			},
			json: true,
		};

		return new Promise((resolve, reject) => {
			rp(settings)
				.then(res => resolve(res.map(e => e.id)))
				.catch(err => reject(new Error(
					`Could not retrieve ProjectIds - ${err.response.body.msg}`,
				)));
		});
	}

	createProject(title, description) {
		const settings = {
			method: 'POST',
			uri: `${this.url}projects`,
			qs: {
				token: this.apiKey,
				userId: this.user,
			},
			body: {
				title,
				description,
			},
			headers: { 'Content-Type': 'application/json' },
			json: true,
		};

		return new Promise((resolve, reject) => {
			rp(settings)
				.then(res => resolve(res))
				.catch(err => reject(
					new Error(`Could not create new Project - ${err.error.msg}`),
				));
		});
	}

	getBoardsByProject(project) {
		const settings = {
			method: 'GET',
			uri: `${this.url}projects/${project}/boards`,
			qs: {
				userId: this.user,
				token: this.apiKey,
			},
			json: true,
		};

		return rp(settings)
			.then(res => res)
			.catch(err => Promise.reject(
				new Error(`Could not retrieve Boards from Projcet - ${err.error.msg}`),
			));
	}

	getBoard(boardId) {
		const settings = {
			method: 'GET',
			uri: `${this.url}boards/${boardId}`,
			qs: {
				token: this.apiKey,
				userId: this.user,
			},
			json: true,
		};

		return rp(settings)
			.then(res => res)
			.catch(err => Promise.reject(
				new Error(`Could not retrieve Board - ${err.error.msg}`),
			));
	}

	createBoard(title, description, project, email = 'schulcloud') {
		const settings = {
			method: 'POST',
			uri: `${this.url}boards`,
			qs: {
				token: this.apiKey,
			},
			body: {
				title,
				description,
				email,
				projectId: project,
			},
			headers: { 'Content-Type': 'application/json' },
			json: true,
		};

		return new Promise((resolve, reject) => {
			rp(settings)
				.then(res => resolve(res))
				.catch(err => reject(
					new Error(`Could not create a new Board - ${err.error.msg}`),
				));
		});
	}
}

module.exports = new Nexboard(
	// process.env.NEXBOARD_API_KEY,
	// process.env.NEXBOARD_USER_ID,
	'5OMGbEuVedWdy7G3yhdmBmCVFDkDW6',
	322,
);
