const { authenticate } = require('@feathersjs/authentication');
const coursesUC = require('../uc/courses.uc');

class CoursesServiceV2 {
	// TODO

	async setup(app) {
		this.app = app;
	}
}

const hooks = {
	before: {
		all: [authenticate('jwt')],
		// TODO
	},
	after: {},
};

module.exports = { CoursesServiceV2, hooks };
