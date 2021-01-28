const AbstractGenerator = require('./AbstractGenerator');

class Submissions extends AbstractGenerator {
    constructor(app) {
        super(app);
        this._service = app.service('submissions');
    }
}

Object.freeze(Submissions);
module.exports = Submissions;