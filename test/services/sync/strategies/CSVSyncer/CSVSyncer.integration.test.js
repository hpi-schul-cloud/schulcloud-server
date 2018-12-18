'use strict';

const chai = require('chai');
const expect = chai.expect;

const app = require('../../../../../src/app');
const roleModel = require('../../../../../src/services/role/model.js');
const {userModel} = require('../../../../../src/services/user/model.js');

const CSVSyncer = require('../../../../../src/services/sync/strategies/CSVSyncer');

const {setupAdmin, getAdminToken, deleteUser} = require('./helper');

describe('CSVSyncer Integration', () => {
    let server;

    before(done => {
        server = app.listen(0, done);
    });

    after(done => {
        server.close(done);
    });

	describe('Scenario 0 - Missing authentication', () => {
        const SCHOOL_ID = '0000d186816abba584714c5f';

        const scenarioParams = {
            query: {
                target: 'csv',
                school: SCHOOL_ID,
                role: 'student',
            },
            provider: 'rest',
        };
        const scenarioData = {
            data: `firstName,lastName,email\nPeter,Pan,peter@pan.de`,
        };

        it('should be accepted for execution', () => {
            expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.be.false;
        });

        it('should initialize without errors', () => {
            const params = CSVSyncer.params(scenarioParams, scenarioData);
            const instance = new CSVSyncer(app, {}, ...params);
            expect(instance).to.exist;
        });

        it('should fail due to mising authentication', async () => {
            try {
                await app.service('sync').create(scenarioData, scenarioParams);
            } catch (err) {
                expect(err.message).to.equal('No auth token');
            }
        });
    });

    describe('Scenario 1 - Importing a single student without classes', () => {
        let scenarioParams;
        let scenarioData;

        const SCHOOL_ID = '0000d186816abba584714c5f';
        const ADMIN_EMAIL = 'foo@bar.baz';
        const SCENARIO_EMAIL = 'peter@pan.de';

        before(async () => {
            await setupAdmin(ADMIN_EMAIL, SCHOOL_ID);

            scenarioParams = {
                query: {
                    target: 'csv',
                    school: SCHOOL_ID,
                    role: 'student',
                },
                headers: {
                    authorization: `Bearer ${await getAdminToken()}`,
                },
                provider: 'rest',
            };
            scenarioData = {
                data: `firstName,lastName,email\nPeter,Pan,${SCENARIO_EMAIL}`,
            };
        });

        after(async () => {
            await deleteUser(ADMIN_EMAIL);
            await deleteUser(SCENARIO_EMAIL);
        });

        it('should be accepted for execution', () => {
            expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.be.false;
        });

        it('should initialize without errors', () => {
            const params = CSVSyncer.params(scenarioParams, scenarioData);
            const instance = new CSVSyncer(app, {}, ...params);
            expect(instance).to.exist;
        });

        it('should import a single student without a class', async () => {
            await app.service('sync').create(scenarioData, scenarioParams);
            const users = await userModel.find({
                email: SCENARIO_EMAIL,
            });
            expect(users.length).to.equal(1);
            const [role] = await roleModel.find({
                _id: users[0].roles[0],
            });
            expect(role.name).to.equal('student');
        });
    });

    describe('Scenario 2 - Importing teachers', () => {
        let scenarioParams;
        let scenarioData;

        const SCHOOL_ID = '0000d186816abba584714c5f';
        const ADMIN_EMAIL = 'foo@bar.baz';
        const TEACHER_EMAILS = [
            'a@b.de',
            'b@c.de',
            'c@d.de',
        ];

        before(async () => {
            await setupAdmin(ADMIN_EMAIL, SCHOOL_ID);

            scenarioParams = {
                query: {
                    target: 'csv',
                    school: SCHOOL_ID,
                    role: 'teacher',
                },
                headers: {
                    authorization: `Bearer ${await getAdminToken()}`,
                },
                provider: 'rest',
            };
            scenarioData = {
                data: 'firstName,lastName,email\n'
                    + `Peter,Pan,${TEACHER_EMAILS[0]}\n`
                    + `Peter,Lustig,${TEACHER_EMAILS[1]}\n`
                    + `Test,Testington,${TEACHER_EMAILS[2]}\n`,
            };
        });

        after(async () => {
            await deleteUser(ADMIN_EMAIL);
            await deleteUser(TEACHER_EMAILS[0]);
            await deleteUser(TEACHER_EMAILS[1]);
            await deleteUser(TEACHER_EMAILS[2]);
        });

        it('should be accepted for execution', () => {
            expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.be.false;
        });

        it('should initialize without errors', () => {
            const params = CSVSyncer.params(scenarioParams, scenarioData);
            const instance = new CSVSyncer(app, {}, ...params);
            expect(instance).to.exist;
        });

        it('should import three teachers without a class', async () => {
            await app.service('sync').create(scenarioData, scenarioParams);
            const users = await userModel.find({
                email: {$in: TEACHER_EMAILS},
            });
            expect(users.length).to.equal(3);
            const [role] = await roleModel.find({
                _id: users[0].roles[0],
            });
            expect(role.name).to.equal('teacher');
        });
    });
});
