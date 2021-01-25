const AbstractGenerator = require('./AbstractGenerator');

class Accounts extends AbstractGenerator {
    constructor(app) {
        super(app);
        this._service = app.service('accounts');
    }

    async create(accountParameters, system, user) {
        if (system) {
            accountParameters.systemId = system._id;
        }
        accountParameters.userId = user._id;
        const result = await this._service.create(accountParameters);
        this._createdEntitiesIds.push(result._id.toString());
        return result;
    }
}

Object.freeze(Accounts);
module.exports = Accounts;