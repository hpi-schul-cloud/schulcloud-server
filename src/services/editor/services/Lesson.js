/* eslint-disable object-curly-newline */
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
	create({ users, _id, owner, title }, params) {
		return request(uri, params, {
			data: { users, _id, owner, title },
		});
	}

	/**
	 * The course patch, or update event will trigger this too.
	 */
	// eslint-disable-next-line object-curly-newline
	patch(lessonId, { title, sections, users, owner }, params) {
		// sectionIds map to steps -> but is solved from Editor MS

		return request(uri, params, {
			data: {
				title, sections, users, owner,
			},
		});
	}

	get(lessonId, params) {
		return request(uri, params);
	}

	remove(lessonId, params) {
		return request(uri, params);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Lesson;
