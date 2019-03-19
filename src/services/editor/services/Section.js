/* eslint-disable class-methods-use-this */
const { request } = require('../helper/');

const uri = 'sections';

class Section {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	/**
	 * @param {object} lesson It create one new template. The owner is take from the lesson.
	 */
	create({ lesson }, params) {
		return request(uri, params, {
			data: { lesson },
		});
	}

	get(sectionId, params) {
		return request(uri, params);
	}

	remove(sectionId, params) {
		return request(uri, params);
	}

	// title as docValue ? wenn nicht dann als db model, würde das data handling für find erleichtern
	patch(sectionId, { state }, params) {
		return request(uri, params, {
			data: { state },
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Section;
