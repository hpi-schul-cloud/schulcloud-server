const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');
const { hasPermission } = require('../hooks');

const nexboardClient = require('../logic/NexboardClient');

const ProjectHooks = {
	before: {
		all: [authenticate('jwt')],
		find: [hasPermission('TOOL_VIEW')],
		get: [hasPermission('TOOL_VIEW')],
		create: [hasPermission('TOOL_CREATE')],
		update: [disallow()],
		patch: [disallow()],
		remove: [disallow()], // TODO: is added later
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

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

	create({
		title = 'Neues Nexboard Projekt',
		description = 'Hier werden alle Nexboards für diese Lerneinheit gesammelt',
	}, params) {
		return nexboardClient.createProject(title, description);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = {
	Project,
	ProjectHooks,
};
