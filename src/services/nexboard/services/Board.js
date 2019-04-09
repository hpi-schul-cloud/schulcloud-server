/* eslint-disable object-curly-newline */
/* eslint-disable class-methods-use-this */

const nexboardClient = require('../utils/Nexboard');

class Board {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	async get(id, params) {
		return nexboardClient.getBoard(id);
	}

	async create({ lessonId, title = 'Neues Nexboard Board', description = 'Ein digitales Whiteboard' }, params) {
		const nexboardProject = await this.app.service('nexboard/project').get(lessonId);
		return nexboardClient.createBoard(title, description, nexboardProject.id);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Board;
