const deleteUserDataUc = require('./deleteUserData.uc');

const facade = {
	deleteUserData: deleteUserDataUc.deleteUserData,
};

module.exports = function setupUsersFacade(app) {
	app.registerFacade('/classes/v2', facade);
};
