const deleteUserUc = require('./deleteUserData.uc');

const facade = (app) => ({
	deleteUserData: deleteUserUc.nestDeleteUserRelatedData(app),
});

module.exports = function setupUsersFacade(app) {
	app.registerFacade('/tasks/v2', facade(app));
};
