const userUc = require('./users.uc');
const userRolesUc = require('./userRoles.uc');

class UserFacade {
	setup(app) {
		this.app = app;
	}

	async deleteUser(id, roleName, params) {
		return userUc.deleteUser(id, roleName, { ...params, app: this.app });
	}

	async userHasRole(userId, roleName) {
		return userRolesUc.hasRole(userId, roleName);
	}
}

module.exports = function setupUsersFacade(app) {
	app.registerFacade('/users/v2', new UserFacade());
};
