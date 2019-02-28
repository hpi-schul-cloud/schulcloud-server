/* eslint-disable class-methods-use-this */
const { request } = require('../helper/');

const uri = 'lesson';

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
	create({ students }, params) {
		return request(uri, params, {
			data: { students },
		});
	}

	/**
	 * The course patch, or update event will trigger this too.
	 */
	patch(lessonId, { title, sectionIds, students, owner }, params) {
		// sectionIds map to steps -> but is solved from Editor MS
		return Promise.resolve({
			lessonId,
			sectionIds, // as Array
		});
	}

	get(lessonId, params) {
		return Promise.resolve({
			steps: [],
			owner: '123',
			students: '123',
			state: {},
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Lesson;
