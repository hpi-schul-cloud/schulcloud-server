const { Users, Accounts, Classes, Schools, Roles, Systems } = require('./generators');

class TestObjectsGenerator {
    constructor(app) {
        this._app = app;
        this._createdUserIds = [];
        this._schoolId = '5f2987e020834114b8efd6f8';

        this._generators = {
            users: new Users(this._app),
            accounts: new Accounts(this._app),
            classes: new Classes(this._app),
            schools: new Schools(this._app),
            roles: new Roles(this._app),
            systems: new Systems(this._app),
        };
    }

    async _generateJWT(username, password) {
        const result = await this._app.service('authentication').create(
                {
                    strategy: 'local',
                    username,
                    password,
                },
                {
                    headers: {
                        'content-type': 'application/json',
                    },
                    provider: 'rest',
                }
        );

        return result.accessToken;
    }

    get createdEntityIds() {
        return {
            users: this._generators.users.created,
            accounts: this._generators.accounts.created,
            schools: this._generators.schools.created,
            roles: this._generators.roles.created
        };
    }

    async createTestUser(data) {
        return this._generators.users.create({ schoolId: this._schoolId, ...data });
    }

    async createTestAccountForUser(data) {
        const credentials = { username: data.email, password: data.email };
        return this._generators.accounts.create(credentials, 'local', data);
    }

    async createTestAccount(data, system, user) {
        return this._generators.accounts.create(data, system, user);
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

    async createTestSchool(data) {
        return this._generators.schools.create(data);
    }

    async createTestRole(data) {
        return this._generators.roles.create(data);
    }

    async createTestSystem(data) {
        return this._generators.systems.create(data);
    }

    async generateRequestParamsFromUser(user) {
        return {
            account: { userId: user._id },
            query: {},
            authentication: {
                accessToken: await this._generateJWT(user.email, user.email),
                strategy: 'jwt',
            },
            provider: 'rest',
        };
    }

    /**
     * remove all created entities from db
     * @returns {Promise<void>}
     */
    async cleanup() {
        await Promise.all(Object.values(this._generators).map((factory) => factory.cleanup()));
    }
}

Object.freeze(TestObjectsGenerator);
module.exports = TestObjectsGenerator;