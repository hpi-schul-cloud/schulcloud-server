const helpdeskUC = require('./helpdesk.uc');

class HelpdeskFacade {
	constructor(app) {
		this.app = app;
	}

	async deleteProblemsForUser(userId) {
		return helpdeskUC.deleteProblemsForUser(userId);
	}
}

module.exports = function setupProblemsFacade(app) {
	app.registerFacade('/helpdesk/v2', new HelpdeskFacade(app));
};
