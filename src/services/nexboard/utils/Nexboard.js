const rp = require('request-promise-native');
const { BadRequest } = require('@feathersjs/errors');
const logger = require('../../../logger');

// TODO: in default Schema eintragen
const {
	NEXBOARD_URL = 'https://nexboard.nexenio.com/',
	NEXBOARD_URI = 'portal/api/v1/public/',
	NEXBOARD_API_KEY,
	NEXBOARD_USER_ID,
} = process.env;

class Nexboard {
	constructor({
		apiKey = NEXBOARD_API_KEY,
		userID = NEXBOARD_USER_ID,
		url = NEXBOARD_URL,
		uri = NEXBOARD_URI,
	} = {}) {
		if (!apiKey || !userID || !url || !uri) {
			logger.error('Missing nextboard envs:', {
				apiKey, userID, url, uri,
			});
		}

		this.apiKey = apiKey;
		this.user = userID;
		this.url = url + uri;
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
			.then((res) => res.map((e) => e.id))
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
			.catch((err) => {
				throw new BadRequest(`Could not create new Project - ${err.error.msg}`);
			});
	}

	getBoardsByProject(project) {
		return rp(this.createSettings({
			endpoint: `projects/${project}/boards`,
		}))
			.catch((err) => {
				throw new BadRequest(`Could not retrieve Boards from Project - ${err.error.msg}`);
			});
	}

	getBoard(boardId) {
		return rp(this.createSettings({
			endpoint: `boards/${boardId}`,
		}))
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
			.catch((err) => {
				throw new BadRequest(`Could not create a new Board - ${err.error.msg}`);
			});
	}
}

module.exports = (url) => new Nexboard({ url });
