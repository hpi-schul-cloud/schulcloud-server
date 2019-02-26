class Lesson {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	// create wird über cours lessons angelegt mit jwt as owner group -> muss der title darüber edit sein

	static patch(lessonId, { title, sectionIds }, params) {
		// sectionIds map to steps -> but is solved from Editor MS
		return {
			lessonId,
			sectionIds, // as Array
		};
	}

	static get(lessonId, params) {
		return {
			steps: [],
			owner: '123',
			students: '123',
			state: {},
		};
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Lesson;
