const deleteUserDataUc = require('./deleteUserData.uc');

class ClassesFacade {
	setup(app) {
		this.app = app;
	}

	async deleteUserData(userIdForDeletion, userContext) {
		// TODO permissions
		// userFromSameSchool(userContext.currentUserId, userIdForDeletion);
		// userHasPermission(userContext.currentUserId, 'DELETE_USER');

		// TODO let nobody change the given userId behind facade, assign it
		return deleteUserDataUc.deleteUserData(userIdForDeletion);
	}
}

module.exports = function setupUsersFacade(app) {
	app.registerFacade('/classes/v2', new ClassesFacade());
};