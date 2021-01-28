const AbstractGenerator = require('./AbstractGenerator');

class Homeworks extends AbstractGenerator {
    constructor(app) {
        super(app);
        this._service = app.service('homework');
    }
}

Object.freeze(Homeworks);
module.exports = Homeworks;