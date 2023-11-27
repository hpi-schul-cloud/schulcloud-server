const registrationPinUc = require('./registrationPin.uc');

class RegistrationPinFacade {
	constructor(app) {
		this.app = app;
	}

	async deleteRegistrationPinsByEmail(email) {
		return registrationPinUc.deleteRegistrationPinsForUser(email);
	}
}

module.exports = function setupRegistrationPinFacade(app) {
	app.registerFacade('/registrationPin/v2', new RegistrationPinFacade(app));
};
