const deleteUserTeamsDataUc = require('./deleteUserTeamsData.uc');

const facade = {
	deleteUserData: deleteUserTeamsDataUc.deleteUserData,
};

module.exports = function setupUsersFacade(app) {
	app.registerFacade('/teams/v2', facade);
};
