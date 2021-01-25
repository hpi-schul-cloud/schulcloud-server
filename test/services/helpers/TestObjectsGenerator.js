// const { Users } = require('./generators/Users');
// const { Accounts } = require('./generators/Accounts');

const { Users, Accounts, Classes } = require('./generators');

class TestObjectsGenerator {
    constructor(app) {
        this._app = app;
        this._createdUserIds = [];
        this._schoolId = '5f2987e020834114b8efd6f8';

        this._generators = {
            users: new Users(this._app),
            accounts: new Accounts(this._app),
            classes: new Classes(this._app)
        };
    }

    // get users() {
    //     return this._generators.users;
    // }
    //

    async createTestUser(data) {
        return this._generators.users.create({ ...data, schoolId: this._schoolId });
    }

    async createTestAccountForUser(data) {
        const credentials = { username: data.email, password: data.email };
        return this._generators.accounts.create(credentials, 'local', data);
    }

    /**
     * shortcut for creating a user and corresponding account
     * @param data
     * @returns {Promise<{user: *, account: *}>}
     */
    async createTestUserAndAccount(data) {
        const user = await this.createTestUser(data);
        const account = await this.createTestAccountForUser(user);
        return { user, account };
    }

    async createTestClass(data) {
        return this._generators.classes.create({ ...data, schoolId: this._schoolId });
    }

    /**
     * remove all created entities from db
     * @returns {Promise<void>}
     */
    async cleanup() {
        await Promise.all(Object.values(this._generators).map((factory) => factory.cleanup()));
    }

    async generateRequestParamsFromUser(user) {
        return { account: { userId: user._id }, query: {} };
    }

    createdEntityIds() {
        return {
            users: this._generators.users.created,
        };
    }
}

Object.freeze(TestObjectsGenerator);
module.exports = TestObjectsGenerator;