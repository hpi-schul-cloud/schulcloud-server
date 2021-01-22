const pseudonymUC = require('./pseudonym.uc');

const facade = {
	deleteUserData: pseudonymUC.deleteUserData,
};

module.exports = function setupFacade(app) {
	app.registerFacade('/pseudonym/v2', facade);
};
