const { expect } = require('chai');

const appPromise = require('../../../../src/app');
const TestObjectGenerator = require('../../helpers/TestObjectsGenerator');

describe('AdminTeachersService', () => {
    let app;
    let adminTeachersService;
    let consentService;
    let server;
    let tog;

    before(async () => {
        app = await appPromise;
        adminTeachersService = app.service('/users/admin/teachers');
        consentService = app.service('consents');
        server = await app.listen(0);
        tog = new TestObjectGenerator(app);
    });

    after((done) => {
        server.close(done);
    });

    afterEach(async () => {
        await tog.cleanup();
    });

    it('is properly registered', () => {
        expect(adminTeachersService).to.not.equal(undefined);
    });

    // https://ticketsystem.schul-cloud.org/browse/SC-5076
    xit('student can not administrate teachers', async () => {
        const student = await tog.createTestUser({ roles: ['student'] });
        const params = await tog.generateRequestParamsFromUser(student);
        params.query = {};
        try {
            await adminTeachersService.find(params);
            throw new Error('should have failed');
        } catch (err) {
            expect(err.message).to.not.equal('should have failed');
            expect(err.message).to.equal(testGenericErrorMessage);
            expect(err.code).to.equal(403);
        }
    });

    // https://ticketsystem.schul-cloud.org/browse/SC-5061
    it('teacher can not find teachers from other schools', async () => {
        const school = await tog.createTestSchool({
            name: 'testSchool1',
        });
        const otherSchool = await tog.createTestSchool({
            name: 'testSchool2',
        });
        const { user: teacher } = await tog.createTestUserAndAccount({ roles: ['teacher'], schoolId: school._id });
        const otherTeacher = await tog.createTestUser({ roles: ['teacher'], schoolId: otherSchool._id });
        const params = await tog.generateRequestParamsFromUser(teacher);
        params.query = {};
        const resultOk = (
                await adminTeachersService.find({
                    account: {
                        userId: teacher._id,
                    },
                    query: {
                        account: {
                            userId: otherTeacher._id,
                        },
                    },
                })
        ).data;
        const idsOk = resultOk.map((e) => e._id.toString());
        expect(idsOk).not.to.include(otherTeacher._id.toString());
    });

    it('filters teachers correctly', async () => {
        const teacherWithoutConsent = await tog.createTestUser({
            birthday: '1992-03-04',
            roles: ['teacher'],
        });
        const teacherWithConsent = await tog.createTestUser({
            birthday: '1991-03-04',
            roles: ['teacher'],
        });

        await consentService.create({
            userId: teacherWithConsent._id,
            userConsent: {
                form: 'digital',
                privacyConsent: true,
                termsOfUseConsent: true,
            },
        });

        const createParams = (status) => ({
            account: {
                userId: teacherWithoutConsent._id,
            },
            query: {
                consentStatus: {
                    $in: [status],
                },
            },
        });
        const resultMissing = (await adminTeachersService.find(createParams('missing'))).data;
        const idsMissing = resultMissing.map((e) => e._id.toString());
        expect(idsMissing).to.include(teacherWithoutConsent._id.toString());
        expect(idsMissing).to.not.include(teacherWithConsent._id.toString());

        const resultParentsAgreed = (await adminTeachersService.find(createParams('parentsAgreed'))).data;
        expect(resultParentsAgreed).to.be.empty;

        const resultOk = (await adminTeachersService.find(createParams('ok'))).data;
        const idsOk = resultOk.map((e) => e._id.toString());
        expect(idsOk).to.include(teacherWithConsent._id.toString());
        expect(idsOk).to.not.include(teacherWithoutConsent._id.toString());
    });

    it('does not allow teacher user creation if school is external', async () => {
        const schoolService = app.service('/schools');
        const serviceCreatedSchool = await schoolService.create({ name: 'test', ldapSchoolIdentifier: 'testId' });
        tog.createdEntityIds.schools.push(serviceCreatedSchool._id);
        const { _id: schoolId } = serviceCreatedSchool;

        const { user: admin } = await tog.createTestUserAndAccount({ roles: ['administrator'], schoolId });
        const params = await tog.generateRequestParamsFromUser(admin);
        const mockData = {
            firstName: 'testFirst',
            lastName: 'testLast',
            roles: ['teacher'],
            schoolId,
        };
        try {
            await adminTeachersService.create(mockData, params);
            expect.fail('The previous call should have failed');
        } catch (err) {
            expect(err.code).to.equal(403);
            expect(err.message).to.equal('Creating new students or teachers is only possible in the source system.');
        }
    });

    it('does not allow user creation if email already exists', async () => {
        const { user: admin } = await tog.createTestUserAndAccount({ roles: ['administrator'] });
        const params = await tog.generateRequestParamsFromUser(admin);
        const mockData = {
            firstName: 'testFirst',
            lastName: 'testLast',
            email: 'teacherTest@de.de',
            roles: ['teacher'],
            schoolId: admin.schoolId,
        };
        // creates first teacher with unique data
        const teacher = await adminTeachersService.create(mockData, params);
        tog.createdEntityIds.users.push(teacher._id);
        // creates second teacher with existent data
        try {
            await adminTeachersService.create(mockData, params);
            expect.fail('The previous call should have failed');
        } catch (err) {
            expect(err.code).to.equal(400);
            expect(err.message).to.equal('Email already exists.');
        }
    });

    it('does not allow user creation if email is disposable', async () => {
        const { user: admin } = await tog.createTestUserAndAccount({ roles: ['administrator'] });
        const params = await tog.generateRequestParamsFromUser(admin);
        const mockData = {
            firstName: 'testFirst',
            lastName: 'testLast',
            email: 'disposable@20minutemail.com',
            roles: ['teacher'],
            schoolId: admin.schoolId,
        };
        // creates teacher with disposable email
        try {
            await adminTeachersService.create(mockData, params);
            expect.fail('The previous call should have failed');
        } catch (err) {
            expect(err.code).to.equal(400);
            expect(err.message).to.equal('EMAIL_DOMAIN_BLOCKED');
        }
    });

    it('users with TEACHER_LIST permission can access the FIND method', async () => {
        await tog.createTestRole({
            name: 'teacherListPerm',
            permissions: ['TEACHER_LIST'],
        });
        const { user: testUser } = await tog.createTestUserAndAccount({
            firstName: 'testUser',
            roles: ['teacherListPerm'],
        });
        const params = await tog.generateRequestParamsFromUser(testUser);
        const { data } = await adminTeachersService.find(params);
        expect(data).to.not.have.lengthOf(0);
    });

    it('users without TEACHER_LIST permission cannot access the FIND method', async () => {
        await tog.createTestRole({
            name: 'noTeacherListPerm',
            permissions: [],
        });
        const { user: testUser } = await tog.createTestUserAndAccount({
            firstName: 'testUser',
            roles: ['noTeacherListPerm'],
        });
        const params = await tog.generateRequestParamsFromUser(testUser);

        try {
            await adminTeachersService.find(params);
            expect.fail('The previous call should have failed');
        } catch (err) {
            expect(err.code).to.equal(403);
            expect(err.message).to.equal('You don\'t have one of the permissions: TEACHER_LIST.');
        }
    });

    it('users with TEACHER_LIST permission can access the GET method', async () => {
        await tog.createTestRole({
            name: 'teacherListPerm',
            permissions: ['TEACHER_LIST'],
        });
        const school = await tog.createTestSchool({
            name: 'testSchool',
        });
        const { user: testUser } = await tog.createTestUserAndAccount({
            firstName: 'testUser',
            roles: ['teacherListPerm'],
            schoolId: school._id,
        });
        const params = await tog.generateRequestParamsFromUser(testUser);
        const teacher = await tog.createTestUser({
            firstName: 'Affenmesserkampf',
            roles: ['teacher'],
            schoolId: school._id,
        });

        const user = await adminTeachersService.get(teacher._id, params);
        expect(user.firstName).to.be.equal(teacher.firstName);
    });

    it('users without TEACHER_LIST permission cannot access the GET method', async () => {
        await tog.createTestRole({
            name: 'noTeacherListPerm',
            permissions: [],
        });
        const school = await tog.createTestSchool({
            name: 'testSchool',
        });
        const { user: testUser } = await tog.createTestUserAndAccount({
            firstName: 'testUser',
            roles: ['noTeacherListPerm'],
            schoolId: school._id,
        });
        const params = await tog.generateRequestParamsFromUser(testUser);
        const teacher = await tog.createTestUser({ roles: ['teacher'], schoolId: school._id });

        try {
            await adminTeachersService.get(teacher._id, params);
            expect.fail('The previous call should have failed');
        } catch (err) {
            expect(err.code).to.equal(403);
            expect(err.message).to.equal('You don\'t have one of the permissions: TEACHER_LIST.');
        }
    });

    it('users cannot GET teachers from foreign schools', async () => {
        await tog.createTestRole({
            name: 'teacherListPerm',
            permissions: ['TEACHER_LIST'],
        });
        const school = await tog.createTestSchool({
            name: 'testSchool1',
        });
        const otherSchool = await tog.createTestSchool({
            name: 'testSchool2',
        });
        const { user: testUser } = await tog.createTestUserAndAccount({
            roles: ['teacherListPerm'],
            schoolId: school._id
        });
        const params = await tog.generateRequestParamsFromUser(testUser);
        const teacher = await tog.createTestUser({ roles: ['teacher'], schoolId: otherSchool._id });
        const user = await adminTeachersService.get(teacher._id, params);
        expect(user).to.be.empty;
    });

    it('users with TEACHER_CREATE permission can access the CREATE method', async () => {
        await tog.createTestRole({
            name: 'teacherCreatePerm',
            permissions: ['TEACHER_CREATE'],
        });
        const school = await tog.createTestSchool({
            name: 'testSchool',
        });
        const { user: testUser } = await tog.createTestUserAndAccount({
            firstName: 'testUser',
            lastName: 'lastTestUser',
            roles: ['teacherCreatePerm'],
            schoolId: school._id,
        });
        const params = await tog.generateRequestParamsFromUser(testUser);
        const teacherData = {
            firstName: 'testCreateTeacher',
            lastName: 'lastTestCreateTeacher',
            email: 'testCreateTeacher@de.de',
            roles: ['teacher'],
            schoolId: school._id,
        };
        const teacher = await adminTeachersService.create(teacherData, params);
        tog.createdEntityIds.users.push(teacher._id);
        expect(teacher).to.not.be.undefined;
        expect(teacher.firstName).to.equals('testCreateTeacher');
    });

    it('users without TEACHER_CREATE permission cannot access the CREATE method', async () => {
        await tog.createTestRole({
            name: 'noTeacherCreatePerm',
            permissions: [],
        });
        const school = await tog.createTestSchool({
            name: 'testSchool',
        });
        const { user: testUser } = await tog.createTestUserAndAccount({
            firstName: 'testUser',
            roles: ['noTeacherCreatePerm'],
            schoolId: school._id,
        });
        const params = await tog.generateRequestParamsFromUser(testUser);
        const teacherData = await tog.createTestUser({
            firstName: 'testCreateTeacher',
            roles: ['teacher'],
        });

        try {
            await adminTeachersService.create(teacherData, params);
            expect.fail('The previous call should have failed');
        } catch (err) {
            expect(err.code).to.equal(403);
            expect(err.message).to.equal('You don\'t have one of the permissions: TEACHER_CREATE.');
        }
    });

    it('users with TEACHER_DELETE permission can access the REMOVE method', async () => {
        await tog.createTestRole({
            name: 'teacherDeletePerm',
            permissions: ['TEACHER_CREATE', 'TEACHER_DELETE'],
        });
        const school = await tog.createTestSchool({
            name: 'testSchool',
        });
        const { user: testUser } = await tog.createTestUserAndAccount({
            firstName: 'testUser',
            roles: ['teacherDeletePerm'],
            schoolId: school._id,
        });
        const params = await tog.generateRequestParamsFromUser(testUser);
        const teacherData = {
            firstName: 'testDeleteTeacher',
            lastName: 'lastTestDeleteTeacher',
            email: 'testDeleteTeacher@de.de',
            roles: ['teacher'],
            schoolId: school._id,
        };
        const teacher = await adminTeachersService.create(teacherData, params);
        params.query = {
            ...params.query,
            _ids: [teacher._id],
        };
        const deletedTeacher = await adminTeachersService.remove(null, params);
        expect(deletedTeacher).to.be.instanceof(Array).and.has.lengthOf(1);
        expect(deletedTeacher[0].firstName).to.equals('testDeleteTeacher');
    });

    it('users without TEACHER_DELETE permission cannot access the REMOVE method', async () => {
        await tog.createTestRole({
            name: 'noTeacherDeletePerm',
            permissions: ['TEACHER_CREATE'],
        });
        const school = await tog.createTestSchool({
            name: 'testSchool',
        });
        const { user: testUser } = await tog.createTestUserAndAccount({
            firstName: 'testUser',
            roles: ['noTeacherDeletePerm'],
            schoolId: school._id,
        });
        const params = await tog.generateRequestParamsFromUser(testUser);
        const teacherData = {
            firstName: 'testDeleteTeacher',
            lastName: 'lastDeleteTeacher',
            email: 'testDeleteTeacher2@de.de',
            roles: ['teacher'],
            schoolId: school._id,
        };
        const teacher = await adminTeachersService.create(teacherData, params);
        tog.createdEntityIds.users.push(teacher._id);
        params.query = {
            ...params.query,
            _ids: [],
        };
        try {
            await adminTeachersService.remove(teacher, params);
            expect.fail('The previous call should have failed');
        } catch (err) {
            expect(err.code).to.equal(403);
            expect(err.message).to.equal('You don\'t have one of the permissions: TEACHER_DELETE.');
        }
    });

    it('users cannot REMOVE teachers from foreign schools', async () => {
        const school = await tog.createTestSchool({
            name: 'testSchool1',
        });
        const otherSchool = await tog.createTestSchool({
            name: 'testSchool2',
        });
        const teacherOne = await tog.createTestUser({
            roles: ['teacher'],
            schoolId: otherSchool._id,
        });
        const teacherTwo = await tog.createTestUser({
            roles: ['teacher'],
            schoolId: otherSchool._id,
        });

        const { user: testUser } = await tog.createTestUserAndAccount({
            roles: ['administrator'],
            schoolId: school._id
        });
        const params = await tog.generateRequestParamsFromUser(testUser);
        params.query = {
            ...params.query,
            _ids: [teacherOne._id, teacherTwo._id],
        };
        try {
            await adminTeachersService.remove(null, params);
            expect.fail('The previous call should have failed');
        } catch (err) {
            expect(err.code).to.equal(403);
            expect(err.message).to.equal('You cannot remove users from other schools.');
        }
    });

    it('REMOVED users should also have their account deleted', async () => {
        const school = await tog.createTestSchool({
            name: 'testSchool',
        });
        const { user: testUser } = await tog.createTestUserAndAccount({
            firstName: 'testUser',
            roles: ['administrator'],
            schoolId: school._id
        });
        const params = await tog.generateRequestParamsFromUser(testUser);

        const teacherDetails = {
            firstName: 'testDeleteTeacher',
            lastName: 'Tested',
            email: 'testDeleteTeacher@tested.de',
            schoolId: school._id,
            manualCleanup: true
        };
        const teacher = await tog.createTestUser(teacherDetails);

        const accountDetails = {
            username: 'testDeleteTeacher@tested.de',
            password: 'ca4t9fsfr3dsd',
            userId: teacher._id,
        };
        const teacherAccount = await app.service('/accounts').create(accountDetails);

        params.query = {
            ...params.query,
            _ids: [teacher._id],
        };
        const deletedAccount = await app.service('accountModel').get(teacherAccount._id);
        expect(deletedAccount).to.not.be.undefined;
        expect(deletedAccount.username).to.equals(teacherAccount.username);

        const deletedTeacher = await adminTeachersService.remove(null, params);
        expect(deletedTeacher).to.be.instanceof(Array).and.has.lengthOf(1);
        expect(deletedTeacher[0].firstName).to.equals('testDeleteTeacher');

        try {
            await app.service('accountModel').get(teacherAccount._id);
            expect.fail('The previous call should have failed');
        } catch (err) {
            expect(err.code).to.equal(404);
        }
    });

    it('REMOVE requests must include _ids or id', async () => {
        const { user: testUser } = await tog.createTestUserAndAccount({ roles: ['administrator'] });
        const params = await tog.generateRequestParamsFromUser(testUser);
        // empty query without _ids key
        params.query = {};
        try {
            await adminTeachersService.remove(null, params);
            expect.fail('The previous call should have failed');
        } catch (err) {
            expect(err.code).to.equal(400);
            expect(err.message).to.equal('The request requires either an id or ids to be present.');
        }
    });

    it('_ids must be of array type', async () => {
        const { user: testUser } = await tog.createTestUserAndAccount({ roles: ['administrator'] });
        const params = await tog.generateRequestParamsFromUser(testUser);
        params.query = {
            ...params.query,
            _ids: 'this is the wrong type',
        };
        try {
            await adminTeachersService.remove(null, params);
            expect.fail('The previous call should have failed');
        } catch (err) {
            expect(err.code).to.equal(400);
            expect(err.message).to.equal('The type for ids is incorrect.');
        }
    });

    it('_ids elements must be a valid objectId', async () => {
        const school = await tog.createTestSchool({
            name: 'testSchool',
        });
        const { user: testUser } = await tog.createTestUserAndAccount({
            firstName: 'testUser',
            roles: ['administrator'],
            schoolId: school._id,
        });
        const params = await tog.generateRequestParamsFromUser(testUser);
        const teacherData = {
            firstName: 'validDeleteTeacher',
            lastName: 'lastValidDeleteTeacher',
            email: 'validDeleteTeacher@de.de',
            roles: ['teacher'],
            schoolId: school._id,
        };
        const teacher = await adminTeachersService.create(teacherData, params);
        params.query = {
            ...params.query,
            _ids: [teacher._id],
        };

        const deletedTeacher = await adminTeachersService.remove(null, params);
        expect(deletedTeacher).to.be.instanceof(Array).and.has.lengthOf(1);
        expect(deletedTeacher[0].firstName).to.equals('validDeleteTeacher');

        const otherTeacherData = {
            firstName: 'otherValidDeleteTeacher',
            lastName: 'otherLastValidDeleteTeacher',
            email: 'otherValidDeleteTeacher@de.de',
            roles: ['teacher'],
            schoolId: school._id,
        };
        const otherTeacher = await adminTeachersService.create(otherTeacherData, params);
        tog.createdEntityIds.users.push(otherTeacher._id);
        params.query = {
            ...params.query,
            _ids: [otherTeacher._id, 'wrong type'],
        };

        try {
            await adminTeachersService.remove(null, params);
            expect.fail('The previous call should have failed');
        } catch (err) {
            expect(err.code).to.equal(400);
            expect(err.message).to.equal('The type for either one or several ids is incorrect.');
        }
    });

    it('id can be both object and string type', async () => {
        const school = await tog.createTestSchool({
            name: 'testSchool',
        });
        const { user: testUser } = await tog.createTestUserAndAccount({
            roles: ['administrator'],
            schoolId: school._id,
        });
        const params = await tog.generateRequestParamsFromUser(testUser);
        params.query = {
            ...params.query,
            _ids: [],
        };
        const teacherData = {
            firstName: 'testDeleteTeacher',
            lastName: 'lastDeleteTeacher',
            email: 'testDeleteTeacher3@de.de',
            roles: ['teacher'],
            schoolId: school._id,
        };

        const objectTypeTeacherTest = await adminTeachersService.create(teacherData, params);
        const deletedObjectType = await adminTeachersService.remove(objectTypeTeacherTest, params);
        expect(deletedObjectType).to.not.be.undefined;
        expect(deletedObjectType.firstName).to.equals('testDeleteTeacher');

        const stringTypeTeacherTest = await adminTeachersService.create(teacherData, params);
        const deletedeStringType = await adminTeachersService.remove(stringTypeTeacherTest._id, params);
        expect(deletedeStringType).to.not.be.undefined;
        expect(deletedeStringType.firstName).to.equals('testDeleteTeacher');
    });
});