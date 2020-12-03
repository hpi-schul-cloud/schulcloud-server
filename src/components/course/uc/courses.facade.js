const coursesUC = require('./courses.uc');

class CoursesFacade {
	setup(app) {
		this.app = app;
	}

	// TODO here we check general permissions!

	// async deleteUser(id, roleName, params) {
	// 	return userUc.deleteUser(id, roleName, { ...params, app: this.app });
	// }

	// async userHasRole(userId, roleName) {
	// 	return userRolesUc.hasRole(userId, roleName);
	// }
}

module.exports = function setupUsersFacade(app) {
	app.registerFacade('/courses/v2', new CoursesFacade());
};
