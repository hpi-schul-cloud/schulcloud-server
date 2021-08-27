const deleteUserDataUc = require('./deleteUserData.uc');

const facade = {
	deleteUserData: deleteUserDataUc.deleteUserData,
	deleteExpiredData: deleteUserDataUc.deleteExpiredData,
};

module.exports = (app) => {
	app.registerFacade('/fileStorage/v2', facade);
};
