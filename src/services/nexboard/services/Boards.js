const nexboardClient = require('../utils/Nexboard');
const { Forbidden } = require('../../../errors');

class Board {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	get(id, params) {
		return nexboardClient.getBoard(id);
	}

	create({ title = 'Neues Nexboard Board', description = 'Ein digitales Whiteboard' }, params) {
		const projectId = params.user.preferences.nexBoardProjectID;
		if (!projectId) {
			throw new Forbidden('nexBoard for user not found');
		}

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
