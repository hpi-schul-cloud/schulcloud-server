const deleteUserTeamsDataUc = require('./deleteUserTeamsData.uc');

const facade = {
	deleteUserData: deleteUserTeamsDataUc.deleteUserTeamsData,
};

module.exports = function setupUsersFacade(app) {
	app.registerFacade('/teams/v2', facade);
};
