const helpdeskUC = require('./helpdesk.uc');

const facade = {
	deleteUserData: helpdeskUC.deleteUserData,
};

module.exports = function setupFacade(app) {
	app.registerFacade('/helpdesk/v2', facade);
};
