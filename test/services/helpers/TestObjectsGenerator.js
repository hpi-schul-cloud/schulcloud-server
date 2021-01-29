const {
    Users,
    Accounts,
    Classes,
    Schools,
    Roles,
    Systems,
    Homeworks,
    Courses,
    Submissions,
    Lessons,
    RegistrationPins,
    Consents
} = require('./generators');

class TestObjectsGenerator {
    constructor(app) {
        this._app = app;
        this._schoolId = '5f2987e020834114b8efd6f8';

        this._generators = {
            users: new Users(this._app),
            accounts: new Accounts(this._app),
            classes: new Classes(this._app),
            schools: new Schools(this._app),
            roles: new Roles(this._app),
            systems: new Systems(this._app),
            homeworks: new Homeworks(this._app),
            courses: new Courses(this._app),
            submissions: new Submissions(this._app),
            lessons: new Lessons(this._app),
            registrationPins: new RegistrationPins(this._app),
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
            roles: this._generators.roles.created,
            registrationPins: this._generators.registrationPins.created,
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
        return this._generators.classes.create({ schoolId: this._schoolId, ...data });
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

    async createTestHomework(data) {
        return this._generators.homeworks.create({ schoolId: this._schoolId, ...data });
    }

    async createTestCourse(data) {
        return this._generators.courses.create({ schoolId: this._schoolId, ...data });
    }

    async createTestSubmission(data) {
        return this._generators.submissions.create({ schoolId: this._schoolId, ...data });
    }

    async createTestLesson(data, params = {}) {
        return this._generators.lessons.create({ schoolId: this._schoolId, ...data }, params);
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
        // just a temporary workaround
        // this should be removed, when we completely reset (teardown) the in-memory-database
        const { user: admin } = await this.createTestUserAndAccount({
            roles: ['superhero', 'teacher'],
            manualCleanup: true
        });
        const params = await this.generateRequestParamsFromUser(admin);
        // params.provider = ['server'];
        params.provider = undefined;

        await Promise.all(Object.values(this._generators).reverse().map((factory) => factory.cleanup(params)));

        // cleanup temporary user
        await this._generators.users.rawService.remove(admin._id);
    }
}

Object.freeze(TestObjectsGenerator);
module.exports = TestObjectsGenerator;