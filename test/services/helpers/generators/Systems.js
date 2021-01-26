const AbstractGenerator = require('./AbstractGenerator');

class Systems extends AbstractGenerator {
    constructor(app) {
        super(app);
        this._service = app.service('systems');
    }
}

Object.freeze(Systems);
module.exports = Systems;