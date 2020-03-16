const nexboardClient = require('../utils/Nexboard');

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

module.exports = Board;
