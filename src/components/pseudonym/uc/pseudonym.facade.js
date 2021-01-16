const pseudonymUC = require('./pseudonym.uc');

class PseudonymFacade {
	setup(app) {
		this.app = app;
	}

	async deleteUserData() {
		return pseudonymUC.deleteUserData();
	}
}

module.exports = function setupFacade(app) {
	app.registerFacade('/pseudonym/v2', new PseudonymFacade());
};
