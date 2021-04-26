const deleteUserDataUc = require('./deleteUserData.uc');

const facade = {
	deleteUserData: deleteUserDataUc.deleteUserData,
};

module.exports = (app) => {
	app.registerFacade('/messenger/v2', facade);
};