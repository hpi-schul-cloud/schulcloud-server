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

		logger.info('Nextboard is set to=', this.url);

		this.err = {
			projectIds: 'Could not retrieve ProjectIds',
			createProject: 'Could not create new Project',
			retrieveBoardsFromProject: 'Could not retrieve Boards from Project',
			retrieveBoards: 'Could not retrieve Board',
			createBoard: 'Could not create a new Board',
		};
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
				throw new BadRequest(this.err.projectIds, err);
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
				throw new BadRequest(this.err.createProject, err);
			});
	}

	getBoardsByProject(project) {
		return rp(this.createSettings({
			endpoint: `projects/${project}/boards`,
		}))
			.catch((err) => {
				throw new BadRequest(this.err.retrieveBoardsFromProject, err);
			});
	}

	getBoard(boardId) {
		return rp(this.createSettings({
			endpoint: `boards/${boardId}`,
		}))
			.catch((err) => {
				throw new BadRequest(this.err.retrieveBoards, err);
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
				throw new BadRequest(this.err.createBoard, err);
			});
	}
}

module.exports = (url) => new Nexboard({ url });
