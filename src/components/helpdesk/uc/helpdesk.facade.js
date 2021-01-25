const helpdeskUC = require('./helpdesk.uc');

class HelpdeskFacade {
	setup(app) {
		this.app = app;
	}

	async deleteUserData() {
		return helpdeskUC.deleteUserData();
	}
}

module.exports = function setupFacade(app) {
	app.registerFacade('/helpdesk/v2', new HelpdeskFacade());
};
