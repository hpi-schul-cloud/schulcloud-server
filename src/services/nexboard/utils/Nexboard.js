const rp = require('request-promise-native');
const { BadRequest } = require('@feathersjs/errors');

const DEFAULT_BASE_URL = 'https://nexboard.nexenio.com/portal/api/v1/public/';

class Nexboard {
	constructor(apiKey, userID, url) {
		this.apiKey = apiKey;
		this.user = userID;
		this.url = url || DEFAULT_BASE_URL;
	}

	createSettings({
		method = 'GET',
		endpoint,
		qs = {
			token: this.apiKey,
			userId: this.user,
		},
		body,
	}) {
		return {
			method,
			uri: `${this.url}${endpoint}`,
			qs,
			body,
			json: true,
		};
	}

	getProject(projectId) {
		return rp(this.createSettings({ endpoint: `projects/${projectId}` }));
	}

	getProjectsIds() {
		return rp(this.createSettings({ endpoint: 'projects' }))
			.then(res => res.map(e => e.id))
			.catch((err) => {
				throw new BadRequest(
					`Could not retrieve ProjectIds - ${err.error.msg}`,
				);
			});
	}

	createProject(title, description) {
		return rp(this.createSettings({
			method: 'POST',
			endpoint: 'projects',
			body: {
				title,
				description,
			},
		}))
			.then(res => res)
			.catch((err) => {
				throw new BadRequest(`Could not create new Project - ${err.error.msg}`);
			});
	}

	getBoardsByProject(project) {
		return rp(this.createSettings({
			endpoint: `projects/${project}/boards`,
		}))
			.then(res => res)
			.catch((err) => {
				throw new BadRequest(`Could not retrieve Boards from Project - ${err.error.msg}`);
			});
	}

	getBoard(boardId) {
		return rp(this.createSettings({
			endpoint: `boards/${boardId}`,
		}))
			.then(res => res)
			.catch((err) => {
				throw new BadRequest(`Could not retrieve Board - ${err.error.msg}`);
			});
	}

	createBoard(title, description, project, email = 'schulcloud') {
		return rp(this.createSettings({
			method: 'POST',
			endpoint: 'boards',
			qs: {
				token: this.apiKey,
			},
			body: {
				title,
				description,
				email,
				projectId: project,
			},
		}))
			.then(res => res)
			.catch((err) => {
				throw new BadRequest(`Could not create a new Board - ${err.error.msg}`);
			});
	}
}

module.exports = url => new Nexboard(
	process.env.NEXBOARD_API_KEY,
	process.env.NEXBOARD_USER_ID,
	url,
);
