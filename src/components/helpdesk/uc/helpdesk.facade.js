const helpdeskUC = require('./helpdesk.uc');

class HelpdeskFacade {
	setup(app) {
		this.app = app;
	}

	async deleteUserData(userId) {
		return helpdeskUC.deleteProblemsForUser(userId);
	}
}

module.exports = function setupProblemsFacade(app) {
	app.registerFacade('/helpdesk/v2', new HelpdeskFacade());
};
