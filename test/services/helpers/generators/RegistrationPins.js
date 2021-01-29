const AbstractGenerator = require('./AbstractGenerator');

class RegistrationPins extends AbstractGenerator {
    constructor(app) {
        super(app);
        this._service = app.service('registrationPins');
    }
}

Object.freeze(RegistrationPins);
module.exports = RegistrationPins;