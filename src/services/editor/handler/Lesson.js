class Lesson {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	// create wird über cours lessons angelegt mit jwt as owner group -> muss der title darüber edit sein

	patch(lessonId, { title, sectionIds }, params) {
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
