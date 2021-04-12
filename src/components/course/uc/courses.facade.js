const deleteUserUc = require('./deleteUserData.uc');

const facade = {
	deleteUserData: deleteUserUc.deleteUserData,
};

module.exports = function setupUsersFacade(app) {
	app.registerFacade('/courses/v2', facade);
};
