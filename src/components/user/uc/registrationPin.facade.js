const registrationPinUc = require('./registrationPin.uc');

class RegistrationPinFacade {
	constructor(app) {
		this.app = app;
	}

	async deleteRegistrationPinsByEmail(email) {
		return registrationPinUc.deleteRegistrationPinsByMail(email);
	}
}

module.exports = function setupRegistrationPinFacade(app) {
	app.registerFacade('/registrationPin/v2', new RegistrationPinFacade(app));
};
