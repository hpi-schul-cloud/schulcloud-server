/* eslint-disable class-methods-use-this */
const { request } = require('../helper/');

const uri = 'lessons';

class Lesson {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	/**
	 * Can only start from local.
	 * In our case, the course create event will trigger this.
	 * The current user is forced as owner, students.
	 */
	create({ users }, params) {
		return request(uri, params, {
			data: { users },
		});
	}

	/**
	 * The course patch, or update event will trigger this too.
	 */
	// eslint-disable-next-line object-curly-newline
	patch(lessonId, { title, steps, users, owner }, params) {
		// sectionIds map to steps -> but is solved from Editor MS

		return request(uri, params, {
			data: {
				title, steps, users, owner,
			},
		});
	}

	get(lessonId, params) {
		return request(uri, params);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Lesson;
