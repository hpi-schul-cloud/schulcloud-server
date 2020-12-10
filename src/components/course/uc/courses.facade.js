const deleteUserUc = require('./deleteUserData.uc');

class CoursesFacade {
	setup(app) {
		this.app = app;
	}

	async deleteUserData() {
		// TODO permissions
		// userFromSameSchool(userContext.currentUserId, userIdForDeletion);
		// userHasPermission(userContext.currentUserId, 'DELETE_USER');

		// TODO let nobody change the given userId behind facade, assign it
		return deleteUserUc.deleteUserData();
	}
}

module.exports = function setupUsersFacade(app) {
	app.registerFacade('/courses/v2', new CoursesFacade());
};
