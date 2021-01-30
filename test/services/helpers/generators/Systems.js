const AbstractGenerator = require('./AbstractGenerator');

class Systems extends AbstractGenerator {
    constructor(app) {
        super(app);
        this._service = app.service('systems');
    }

    async create(data = { url: '', type: 'moodle' }) {
        return super.create(data);
    }
}

Object.freeze(Systems);
module.exports = Systems;