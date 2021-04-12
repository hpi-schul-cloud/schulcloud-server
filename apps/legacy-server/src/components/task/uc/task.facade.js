const deleteUserUc = require('./deleteUserData.uc');

const facade = {
	deleteUserData: deleteUserUc.deleteUserRelatedData,
};

module.exports = function setupUsersFacade(app) {
	app.registerFacade('/tasks/v2', facade);
};
