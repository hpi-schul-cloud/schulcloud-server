const registrationPinUc = require('./registrationPin.uc');

class RegistrationPinFacade {
	constructor(app) {
		this.app = app;
	}

	async getRegistrationPinsForUser(email) {
		return registrationPinUc.getRegistrationPinsForUser(email);
	}

	async deleteRegistrationPins(pinIds) {
		return registrationPinUc.deleteRegistrationPins(pinIds);
	}

	async deleteRegistrationPinsByEmail(email) {
		return registrationPinUc.deleteRegistrationPinsByMail(email);
	}
}

module.exports = function setupRegistrationPinFacade(app) {
	app.registerFacade('/registrationPin/v2', new RegistrationPinFacade(app));
};
