const userUc = require('./users.uc');
const disallow = require('../../../common/disallow.hook');

class UserFacade {
	setup(app) {
		this.app = app;
	}

	async deleteUser(id, params) {
		return userUc.deleteUserUC(id, { ...params, app: this.app });
	}
}

module.exports = function setupUsersFacade(app) {
	app.use('/userFacade', new UserFacade());
	app.service('userFacade').hooks(disallow);
};
