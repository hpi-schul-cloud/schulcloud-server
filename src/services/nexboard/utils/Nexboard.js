const rp = require('request-promise-native');
const { Configuration } = require('@hpi-schul-cloud/commons');
const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');
const logger = require('../../../logger');

/**
 * Is created and designed as singleton.
 * Options only hold as global envirements, or in config file.
 */
class Nexboard {
	constructor() {
		if (Configuration.has('NEXBOARD_URL') && Configuration.has('NEXBOARD_URI')) {
			this.url = () => Configuration.get('NEXBOARD_URL') + Configuration.get('NEXBOARD_URI');
			logger.info('Nextboard url+uri is set to=', this.url());
		} else {
			this.url = null;
			logger.info('Nextboard url or uri is not defined');
		}

		this.err = {
			getProject: 'Could not retrieve this Project.',
			projectIds: 'Could not retrieve ProjectIds.',
			createProject: 'Could not create new Project',
			retrieveBoardsFromProject: 'Could not retrieve Boards from Project.',
			retrieveBoards: 'Could not retrieve Board.',
			createBoard: 'Could not create a new Board.',
		};
	}

	createSettings({
		method = 'GET',
		endpoint,
		qs = {
			token: Configuration.get('NEXBOARD_API_KEY'),
			userId: Configuration.get('NEXBOARD_USER_ID'),
		},
		body,
	}) {
		return {
			method,
			uri: `${this.url()}${endpoint}`,
			qs,
			body,
			json: true,
		};
	}

	getProject(projectId) {
		return rp(this.createSettings({ endpoint: `projects/${projectId}` })).catch((err) => {
			throw new BadRequest(this.err.getProject, err);
		});
	}

	getProjectsIds() {
		return rp(this.createSettings({ endpoint: 'projects' }))
			.then((res) => res.map((e) => e.id))
			.catch((err) => {
				throw new BadRequest(this.err.projectIds, err);
			});
	}

	createProject(title, description) {
		return rp(
			this.createSettings({
				method: 'POST',
				endpoint: 'projects',
				body: {
					title,
					description,
				},
			})
		).catch((err) => {
			throw new BadRequest(this.err.createProject, err);
		});
	}

	getBoardsByProject(project) {
		return rp(
			this.createSettings({
				endpoint: `projects/${project}/boards`,
			})
		).catch((err) => {
			throw new BadRequest(this.err.retrieveBoardsFromProject, err);
		});
	}

	getBoard(boardId) {
		return rp(
			this.createSettings({
				endpoint: `boards/${boardId}`,
			})
		).catch((err) => {
			throw new BadRequest(this.err.retrieveBoards, err);
		});
	}

	createBoard(title, description, project, email = 'schulcloud') {
		return rp(
			this.createSettings({
				method: 'POST',
				endpoint: 'boards',
				qs: {
					token: Configuration.get('NEXBOARD_API_KEY'),
				},
				body: {
					title,
					description,
					email,
					projectId: project,
				},
			})
		).catch((err) => {
			throw new BadRequest(this.err.createBoard, err);
		});
	}
}

module.exports = new Nexboard();
