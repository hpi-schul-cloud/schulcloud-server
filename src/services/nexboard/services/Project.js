/* eslint-disable object-curly-newline */
/* eslint-disable class-methods-use-this */
const nexboardClient = require('../utils/Nexboard')();

class Project {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	async get(id, params) {
		return nexboardClient.getProject(id);
	}

	find(params) {
		return nexboardClient.getProjectsIds();
	}

	async create({
		title = 'Neues Nexboard Projekt',
		description = 'Hier werden alle Nexboards für diese Lerneinheit gesammelt',
	}, params) {
		const project = await nexboardClient.createProject(title, description);
		return project;
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Project;
