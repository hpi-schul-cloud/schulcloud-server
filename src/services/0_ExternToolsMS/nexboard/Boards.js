const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');
const { hasPermission } = require('../hooks');

const nexboardClient = require('../logic/NexboardClient');

const BoardHooks = {
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


class Board {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	get(id, params) {
		return nexboardClient.getBoard(id);
	}

	create({ projectId, title = 'Neues Nexboard Board', description = 'Ein digitales Whiteboard' }, params) {
		return nexboardClient.createBoard(title, description, projectId);
	}

	find(params) {
		return nexboardClient.getBoardsByProject(params.query.projectId);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = {
	Board,
	BoardHooks,
};
