const userUc = require('./users.uc');
const userRolesUc = require('./userRoles.uc');

class UserFacade {
	constructor(app) {
		this.app = app;
	}

	async getSchoolIdOfUser(userId) {
		return userUc.getSchoolIdOfUser(userId);
	}

	// async deleteUser(id, roleName, params) {
	// 	await userUc.checkPermissions(id, this.roleName, 'DELETE', { ...params });
	// 	return userUc.deleteUser(id);
	// }

	async userHasRole(userId, roleName) {
		return userRolesUc.hasRole(userId, roleName);
	}

	async getSchoolIdOfDeletedUser(userId) {
		return userUc.getSchoolIdOfDeletedUser(userId);
	}

	async getExpiredTrashbinDataByScope(scope) {
		return userUc.getExpiredTrashbinDataByScope(scope);
	}
}

module.exports = function setupUsersFacade(app) {
	app.registerFacade('/users/v2', new UserFacade(app));
};
