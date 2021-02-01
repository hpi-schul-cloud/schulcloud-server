const fileStorageFacade = require('./uc/fileStorage.facade');

module.exports = (app) => {
	app.configure(fileStorageFacade);
};
