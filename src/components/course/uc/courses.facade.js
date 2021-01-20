const deleteUserUc = require('./deleteUserData.uc');

class CoursesFacade {
	setup(app) {
		this.app = app;
	}

	async deleteUserData() {
		// does not check permissions!
		return deleteUserUc.deleteUserData();
	}
}

module.exports = function setupUsersFacade(app) {
	app.registerFacade('/courses/v2', new CoursesFacade());
};
