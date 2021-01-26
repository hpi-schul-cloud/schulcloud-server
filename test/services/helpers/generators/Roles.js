const AbstractGenerator = require('./AbstractGenerator');

class Roles extends AbstractGenerator {
    constructor(app) {
        super(app);
        this._service = app.service('roles');
    }
}

Object.freeze(Roles);
module.exports = Roles;