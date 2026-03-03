const deleteUserDataUc = require('./deleteUserData.uc');

const facade = {
	deleteUserData: deleteUserDataUc.deleteUserData,
};

module.exports = (app) => {
	app.registerFacade('/fileStorage/v2', facade);
};
