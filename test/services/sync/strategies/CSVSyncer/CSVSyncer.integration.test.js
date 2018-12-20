'use strict';

const chai = require('chai');
const expect = chai.expect;

const app = require('../../../../../src/app');
const roleModel = require('../../../../../src/services/role/model.js');
const {userModel} = require('../../../../../src/services/user/model.js');

const CSVSyncer = require('../../../../../src/services/sync/strategies/CSVSyncer');

const {setupAdmin, getAdminToken, deleteUser, createClass, findClass, deleteClass} = require('./helper');

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
            const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

            expect(stats['success']).to.equal(true);
            expect(stats['users']['successful']).to.equal(1);
            expect(stats['users']['failed']).to.equal(0);
            expect(stats['invitations']['successful']).to.equal(0);
            expect(stats['invitations']['failed']).to.equal(0);
            expect(stats['classes']['successful']).to.equal(0);
            expect(stats['classes']['failed']).to.equal(0);

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
            const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

            expect(stats['success']).to.equal(true);
            expect(stats['users']['successful']).to.equal(3);
            expect(stats['users']['failed']).to.equal(0);
            expect(stats['invitations']['successful']).to.equal(0);
            expect(stats['invitations']['failed']).to.equal(0);
            expect(stats['classes']['successful']).to.equal(0);
            expect(stats['classes']['failed']).to.equal(0);

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

    describe('Scenario 3 - Importing students with classes', () => {
        let scenarioParams;
        let scenarioData;

        const SCHOOL_ID = '0000d186816abba584714c5f';
        const ADMIN_EMAIL = 'foo@bar.baz';
        const STUDENT_EMAILS = ['a@b.de', 'b@c.de', 'c@d.de', 'd@e.de', 'e@f.de'];

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
                data: 'firstName,lastName,email,class\n'
                    + `Turanga,Leela,${STUDENT_EMAILS[0]},\n`
                    + `Dr. John A.,Zoidberg,${STUDENT_EMAILS[1]},1a\n`
                    + `Amy,Wong,${STUDENT_EMAILS[2]},1a\n`
                    + `Philip J.,Fry,${STUDENT_EMAILS[3]},1b+2b\n`
                    + `Bender Bending,Rodriguez,${STUDENT_EMAILS[4]},2b+2c\n`,
            };
        });

        after(async () => {
            await deleteUser(ADMIN_EMAIL);
            await Promise.all(STUDENT_EMAILS.map(email => deleteUser(email)));
            await Promise.all([['1', 'a'], ['1', 'b'], ['2', 'b'], ['2', 'c']].map(klass => deleteClass(klass)));
        });

        it('should be accepted for execution', () => {
            expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.be.false;
        });

        it('should initialize without errors', () => {
            const params = CSVSyncer.params(scenarioParams, scenarioData);
            const instance = new CSVSyncer(app, {}, ...params);
            expect(instance).to.exist;
        });

        it('should import five students in different classes', async () => {
            const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

            expect(stats['success']).to.equal(true);
            expect(stats['users']['successful']).to.equal(5);
            expect(stats['users']['failed']).to.equal(0);
            expect(stats['invitations']['successful']).to.equal(0);
            expect(stats['invitations']['failed']).to.equal(0);
            expect(stats['classes']['successful']).to.equal(4);
            expect(stats['classes']['failed']).to.equal(0);

            const classes = await Promise.all(STUDENT_EMAILS.map(async email => {
                const [user] = await userModel.find({
                    email: email,
                });
                const [role] = await roleModel.find({
                    _id: user.roles[0],
                });
                expect(role.name).to.equal('student');
                return app.service('classes').find({
                    query: { userIds: user._id },
                    paginate: false,
                });
            }));

            expect(classes[0].length).to.equal(0);
            expect(classes[1].length).to.equal(1);
            expect(classes[1][0].gradeLevel.name).to.equal('1');
            expect(classes[1][0].name).to.equal('a');
            expect(classes[2].length).to.equal(1);
            expect(classes[2][0].gradeLevel.name).to.equal('1');
            expect(classes[2][0].name).to.equal('a');
            expect(classes[3].length).to.equal(2);
            expect(classes[4].length).to.equal(2);

            const studentLastNames = async student => {
                const [user] = await app.service('users').find({
                    query: {
                        _id: student,
                    },
                    paginate: false,
                });
                return user.lastName;
            };

            const class1a = await findClass(['1', 'a']);
            const class1astudents = await Promise.all(class1a.userIds.map(studentLastNames));
            expect(class1astudents).to.include('Wong');
            expect(class1astudents).to.include('Zoidberg');

            const class2b = await findClass(['2', 'b']);
            const class2bstudents = await Promise.all(class2b.userIds.map(studentLastNames));
            expect(class2bstudents).to.include('Fry');
            expect(class2bstudents).to.include('Rodriguez');

        });
    });

    describe('Scenario 4 - Importing teachers into existing classes', () => {
        let scenarioParams;
        let scenarioData;

        const SCHOOL_ID = '0000d186816abba584714c5f';
        const EXISTING_CLASSES = [['1', 'a'], [undefined, 'SG1'], ['12', '/3']];
        const ADMIN_EMAIL = 'foo@bar.baz';
        const TEACHER_EMAILS = ['a@b.de', 'b@c.de', 'c@d.de', 'd@e.de', 'e@f.de'];

        before(async () => {
            await setupAdmin(ADMIN_EMAIL, SCHOOL_ID);
            await Promise.all(EXISTING_CLASSES.map(klass => createClass([...klass, SCHOOL_ID])));

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
                data: 'firstName,lastName,email,class\n'
                    + `Jonathan 'Jack',O'Neill,${TEACHER_EMAILS[0]},1a\n`
                    + `Dr. Samantha 'Sam',Carter,${TEACHER_EMAILS[1]},1a+SG1\n`
                    + `Daniel,Jackson,${TEACHER_EMAILS[2]},Archeology\n`
                    + `Teal'c,of Chulak,${TEACHER_EMAILS[3]},SG1\n`
                    + `George,Hammond,${TEACHER_EMAILS[4]},12/3\n`,
            };
        });

        after(async () => {
            await deleteUser(ADMIN_EMAIL);
            await Promise.all(TEACHER_EMAILS.map(email => deleteUser(email)));
            await Promise.all(EXISTING_CLASSES.map(klass => deleteClass(klass)));
            await deleteClass([undefined, 'Archeology']);
        });

        it('should be accepted for execution', () => {
            expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.be.false;
        });

        it('should initialize without errors', () => {
            const params = CSVSyncer.params(scenarioParams, scenarioData);
            const instance = new CSVSyncer(app, {}, ...params);
            expect(instance).to.exist;
        });

        it('should import five teachers into three existing classes', async () => {
            const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

            expect(stats['success']).to.equal(true);
            expect(stats['users']['successful']).to.equal(5);
            expect(stats['users']['failed']).to.equal(0);
            expect(stats['invitations']['successful']).to.equal(0);
            expect(stats['invitations']['failed']).to.equal(0);
            expect(stats['classes']['successful']).to.equal(4);
            expect(stats['classes']['failed']).to.equal(0);

            await Promise.all(TEACHER_EMAILS.map(async email => {
                const [user] = await userModel.find({
                    email: email,
                });
                const [role] = await roleModel.find({
                    _id: user.roles[0],
                });
                expect(role.name).to.equal('teacher');
            }));

            const teacherLastNames = async teacher => {
                const [user] = await app.service('users').find({
                    query: {
                        _id: teacher,
                    },
                    paginate: false,
                });
                return user.lastName;
            };

            const sg1 = await findClass([undefined, 'SG1']);
            expect(sg1.teacherIds.length).to.equal(2);
            const sg1teachers = await Promise.all(sg1.teacherIds.map(teacherLastNames));
            expect(sg1teachers).to.include('Carter');
            expect(sg1teachers).to.include('of Chulak');

            const class1a = await findClass(['1', 'a']);
            expect(class1a.teacherIds.length).to.equal(2);
            const class1ateachers = await Promise.all(class1a.teacherIds.map(teacherLastNames));
            expect(class1ateachers).to.include('Carter');
            expect(class1ateachers).to.include('O\'Neill');

            const archeology = await findClass([undefined, 'Archeology']);
            expect(archeology.teacherIds.length).to.equal(1);
            const archeologyteachers = await Promise.all(archeology.teacherIds.map(teacherLastNames));
            expect(archeologyteachers).to.include('Jackson');

            const class12 = await findClass(['12', '/3']);
            expect(class12.teacherIds.length).to.equal(1);
            const class12teachers = await Promise.all(class12.teacherIds.map(teacherLastNames));
            expect(class12teachers).to.include('Hammond');
        });
    });

    describe.skip('Scenario 5 - Importing teachers and sending invitation emails', () => {
        let scenarioParams;
        let scenarioData;

        const SCHOOL_ID = '0000d186816abba584714c5f';
        const ADMIN_EMAIL = 'foo@bar.baz';
        const TEACHER_EMAILS = ['a@b.de', 'b@c.de', 'c@d.de'];
        const CLASSES = [[undefined, 'NSA'], [undefined, 'CIA'], [undefined, 'BuyMore']];

        before(async () => {
            await setupAdmin(ADMIN_EMAIL, SCHOOL_ID);
            await Promise.all(CLASSES.map(klass => createClass([...klass, SCHOOL_ID])));

            scenarioParams = {
                query: {
                    target: 'csv',
                    school: SCHOOL_ID,
                    role: 'teacher',
                    sendEmails: 'true',
                },
                headers: {
                    authorization: `Bearer ${await getAdminToken()}`,
                },
                provider: 'rest',
            };
            scenarioData = {
                data: 'firstName,lastName,email,class\n'
                    + `Chuck,Bartowski,${TEACHER_EMAILS[0]},BuyMore\n`
                    + `Sarah,Walker,${TEACHER_EMAILS[1]},NSA\n`
                    + `Colonel John,Casey,${TEACHER_EMAILS[2]},CIA\n`,
            };
        });

        after(async () => {
            await deleteUser(ADMIN_EMAIL);
            await Promise.all(TEACHER_EMAILS.map(email => deleteUser(email)));
            await Promise.all(CLASSES.map(klass => deleteClass(klass)));
        });

        it('should be accepted for execution', () => {
            expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.be.false;
        });

        it('should initialize without errors', () => {
            const params = CSVSyncer.params(scenarioParams, scenarioData);
            const instance = new CSVSyncer(app, {}, ...params);
            expect(instance).to.exist;
        });

        it('should import five teachers into three existing classes', async () => {
            const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

            expect(stats['success']).to.equal(true);
            expect(stats['users']['successful']).to.equal(3);
            expect(stats['users']['failed']).to.equal(0);
            expect(stats['invitations']['successful']).to.equal(0);
            expect(stats['invitations']['failed']).to.equal(0);
            expect(stats['classes']['successful']).to.equal(3);
            expect(stats['classes']['failed']).to.equal(0);

            await Promise.all(TEACHER_EMAILS.map(async email => {
                const [user] = await userModel.find({
                    email: email,
                });
                const [role] = await roleModel.find({
                    _id: user.roles[0],
                });
                expect(role.name).to.equal('teacher');
            }));
        });
    });

    describe('Scenario 6 - Éncöding', () => {
        let scenarioParams;
        let scenarioData;

        const SCHOOL_ID = '0000d186816abba584714c5f';
        const EXISTING_CLASSES = [['1', 'a'], ['2', 'b']];
        const ADMIN_EMAIL = 'foo@bar.baz';
        const STUDENT_EMAILS = ['a@b.de', 'b@c.de', 'c@d.de'];

        before(async () => {
            await setupAdmin(ADMIN_EMAIL, SCHOOL_ID);
            await Promise.all(EXISTING_CLASSES.map(klass => createClass([...klass, SCHOOL_ID])));

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
                data: 'firstName,lastName,email,class\n'
                    + `工藤,新,${STUDENT_EMAILS[0]},1a\n`
                    + `毛利,蘭,${STUDENT_EMAILS[1]},1a\n`
                    + `毛利,小五郎,${STUDENT_EMAILS[2]},2b\n`,
            };
        });

        after(async () => {
            await deleteUser(ADMIN_EMAIL);
            await Promise.all(STUDENT_EMAILS.map(email => deleteUser(email)));
            await Promise.all(EXISTING_CLASSES.map(klass => deleteClass(klass)));
        });

        it('should be accepted for execution', () => {
            expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.be.false;
        });

        it('should initialize without errors', () => {
            const params = CSVSyncer.params(scenarioParams, scenarioData);
            const instance = new CSVSyncer(app, {}, ...params);
            expect(instance).to.exist;
        });

        it('should import three exchange students', async () => {
            const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

            expect(stats['success']).to.equal(true);
            expect(stats['users']['successful']).to.equal(3);
            expect(stats['users']['failed']).to.equal(0);
            expect(stats['invitations']['successful']).to.equal(0);
            expect(stats['invitations']['failed']).to.equal(0);
            expect(stats['classes']['successful']).to.equal(2);
            expect(stats['classes']['failed']).to.equal(0);

            await Promise.all(STUDENT_EMAILS.map(async email => {
                const [user] = await userModel.find({
                    email: email,
                });
                const [role] = await roleModel.find({
                    _id: user.roles[0],
                });
                expect(role.name).to.equal('student');
            }));

            const studentLastNames = async student => {
                const [user] = await app.service('users').find({
                    query: {
                        _id: student,
                    },
                    paginate: false,
                });
                return user.lastName;
            };

            const class1a = await findClass(['1', 'a']);
            expect(class1a.userIds.length).to.equal(2);
            const class1astudents = await Promise.all(class1a.userIds.map(studentLastNames));
            expect(class1astudents).to.include('新');
            expect(class1astudents).to.include('蘭');

            const class2b = await findClass(['2', 'b']);
            expect(class2b.userIds.length).to.equal(1);
            const class2bstudents = await Promise.all(class2b.userIds.map(studentLastNames));
            expect(class2bstudents).to.include('小五郎');
        });
    });
});
