const rnd = () => Math.round(Math.random() * 10000);
const AbstractGenerator = require('./AbstractGenerator');

class Users extends AbstractGenerator {
    constructor(app) {
        super(app);
        this._service = app.service('users');
    }

    async create({
                     firstName = 'Max', lastName = 'Mustermann', birthday = undefined,
                     email = `max${`${Date.now()}_${rnd()}`}@mustermann.de`, schoolId = this._schoolId,
                     accounts = [], roles = [], discoverable = undefined, firstLogin = false,
                     manualCleanup = false, ...otherParams
                 } = {  }) {

        const result = await this._service.create({
            firstName,
            lastName,
            birthday,
            email,
            schoolId,
            accounts,
            roles,
            discoverable,
            preferences: { firstLogin, }, ...otherParams,
        });

        if (!manualCleanup) {
            this._createdEntitiesIds.push(result._id.toString());
        }
        return result;
    }
}

Object.freeze(Users);
module.exports = Users;