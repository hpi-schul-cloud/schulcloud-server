const helpdeskUC = require('./helpdesk.uc');

class HelpdeskFacade {
	setup(app) {
		this.app = app;
	}

	async deleteUserData() {
		return helpdeskUC.deleteProblemsForUser();
	}
}

module.exports = function setupProblemsFacade(app) {
	app.registerFacade('/helpdesk/v2', new HelpdeskFacade());
};
