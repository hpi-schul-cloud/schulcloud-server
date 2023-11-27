const nexboardClient = require('../utils/Nexboard');

class Project {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	get(id, params) {
		return nexboardClient.getProject(id);
	}

	find(params) {
		return nexboardClient.getProjectsIds();
	}

	create(
		{ title = 'Neues Nexboard Projekt', description = 'Hier werden alle Nexboards für diese Lerneinheit gesammelt' },
		params
	) {
		return nexboardClient.createProject(title, description);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Project;
