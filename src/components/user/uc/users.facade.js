const UserUc = require('./users.uc');
const disallow = require('../../../common/disallow.hook');

class UserFacade {
	setup(app) {
		this.userUc = new UserUc(app);
	}

	async deleteUser(id) {
		return this.userUc.deleteUserUC(id);
	}

	async replaceUserWithTombstone(id) {
		return this.userUc.replaceUserWithTombstoneUC(id);
	}
}

module.exports = function setupUsersFacade(app) {
	app.use('/userFacade', new UserFacade());
	app.service('userFacade').hooks(disallow);
};
