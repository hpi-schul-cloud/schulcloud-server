const schoolsUc = require('./schools.uc');

const facade = {
	getStorageProviderForSchool: schoolsUc.getStorageProviderForSchool,
};

module.exports = (app) => {
	app.registerFacade('/school/v2', facade);
};
