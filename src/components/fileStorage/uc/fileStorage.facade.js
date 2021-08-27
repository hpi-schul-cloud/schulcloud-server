const deleteUserDataUc = require('./deleteUserData.uc');

const facade = {
	deleteUserData: deleteUserDataUc.deleteUserData,
	deleteExpiredData: deleteUserDatauc.deleteExpiredData,
};

module.exports = (app) => {
	app.registerFacade('/fileStorage/v2', facade);
};
