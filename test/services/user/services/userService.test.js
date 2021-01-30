const assert = require('assert');
const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { ObjectId } = require('mongoose').Types;
const appPromise = require('../../../../src/app');

const TestObjectsGenerator = require('../../helpers/TestObjectsGenerator');
const { equal: equalIds } = require('../../../../src/helper/compare').ObjectId;

const testGenericErrorMessage = 'Der angefragte Nutzer ist unbekannt!';

describe('user service', () => {
    let userService;
    let classesService;
    let coursesService;
    let app;
    let server;
    let tog;

    before(async () => {
        app = await appPromise;
        userService = app.service('users');
        classesService = app.service('classes');
        coursesService = app.service('courses');
        server = await app.listen(0);
        tog = new TestObjectsGenerator(app);
    });

    after(async () => {
        await server.close();
    });

    afterEach(async () => {
        await tog.cleanup();
    });

    it('registered the users service', () => {
        assert.ok(userService);
        assert.ok(classesService);
        assert.ok(coursesService);
    });

    it('resolves permissions and attributes correctly', async () => {
        const testBase = await tog.createTestRole({
            name: 'test_base',
            roles: [],
            permissions: ['TEST_BASE', 'TEST_BASE_2'],
        });
        const testSubrole = await tog.createTestRole({
            name: 'test_subrole',
            roles: [testBase._id],
            permissions: ['TEST_SUB'],
        });
        let user = await tog.createTestUser({
            id: '0000d231816abba584714d01',
            accounts: [],
            schoolId: '5f2987e020834114b8efd6f8',
            email: 'user1246@testusers.net',
            firstName: 'Max',
            lastName: 'Tester',
            roles: [testSubrole._id]
        });
        user = await userService.get(user._id);

        expect(user.avatarInitials).to.eq('MT');
        const array = Array.from(user.permissions);
        expect(array).to.have.lengthOf(3);
        expect(array).to.include('TEST_BASE', 'TEST_BASE_2', 'TEST_SUB');
    });

    describe('GET', () => {
        it('student can read himself', async () => {
            const { user: student } = await tog.createTestUserAndAccount({
                roles: ['student'],
                birthday: Date.now(),
                ldapId: 'thisisauniqueid',
            });
            const params = await tog.generateRequestParamsFromUser(student);
            params.query = {};
            const result = await userService.get(student._id, params);
            expect(result).to.not.be.undefined;
            expect(result).to.haveOwnProperty('firstName');
            expect(result).to.haveOwnProperty('lastName');
            expect(result).to.haveOwnProperty('displayName');
            expect(result).to.haveOwnProperty('email');
            expect(result).to.haveOwnProperty('birthday');
            expect(result).to.haveOwnProperty('ldapId');
        });

        it('student can not read admin email', async () => {
            const { user: student } = await tog.createTestUserAndAccount({
                roles: ['student'],
                birthday: Date.now(),
                ldapId: 'thisisauniqueid',
                schoolId: new ObjectId('5f2987e020834114b8efd6f8'), // admin school id
            });
            const params = await tog.generateRequestParamsFromUser(student);
            params.query = {};
            const result = await userService.get('0000d213816abba584714c0a', params); // admin user id
            expect(result.email).to.be.undefined;
        });

        it('student can not read student from foreign school', async () => {
            await tog.createTestRole({
                name: 'studentList',
                permissions: ['STUDENT_LIST'],
            });
            const school = await tog.createTestSchool({
                name: 'testSchool1',
            });
            const otherSchool = await tog.createTestSchool({
                name: 'testSchool2',
            });
            const { user: student } = await tog.createTestUserAndAccount({
                roles: ['studentList'],
                schoolId: school._id
            });
            const { user: otherStudent } = await tog.createTestUserAndAccount({
                roles: ['student'],
                schoolId: otherSchool._id
            });
            const params = await tog.generateRequestParamsFromUser(student);
            params.query = {};
            try {
                await userService.get(otherStudent._id, params);
                throw new Error('should have failed');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed');
                expect(err.message).to.equal(testGenericErrorMessage);
                expect(err.code).to.equal(403);
            }
        });

        // https://ticketsystem.schul-cloud.org/browse/SC-5074
        xit('student can not read unknown student', async () => {
            await tog.createTestRole({
                name: 'studentList',
                permissions: ['STUDENT_LIST'],
            });
            const student = await tog.createTestUser({ roles: ['studentList'] });
            const params = await tog.generateRequestParamsFromUser(student);
            params.query = {};
            try {
                await userService.get('AAAAAAAAAAAAAAAAAAAAAAAAAAA', params);
                throw new Error('should have failed');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed');
                expect(err.message).to.equal(testGenericErrorMessage);
                expect(err.code).to.equal(403);
            }
        });

        it('student can read other student with STUDENT_LIST permission', async () => {
            await tog.createTestRole({
                name: 'studentList',
                permissions: ['STUDENT_LIST'],
            });
            const { user: student } = await tog.createTestUserAndAccount({ roles: ['studentList'] });
            const otherStudent = await tog.createTestUser({ roles: ['student'], birthday: Date.now() });
            const params = await tog.generateRequestParamsFromUser(student);
            params.query = {};
            const result = await userService.get(otherStudent._id, params);
            expect(result).to.not.be.undefined;
            expect(result).to.haveOwnProperty('firstName');
            expect(result).to.haveOwnProperty('lastName');
            expect(result).to.haveOwnProperty('displayName');
            expect(result).not.to.haveOwnProperty('email');
            expect(result).not.to.haveOwnProperty('birthday');
            expect(result).not.to.haveOwnProperty('ldapId');
        });

        it('does not allow students to read other students without STUDENT_LIST permission', async () => {
            await tog.createTestRole({ name: 'notAuthorized', permissions: [] });
            const studentToRead = await tog.createTestUser({ roles: ['student'] });
            const { user: actingUser } = await tog.createTestUserAndAccount({ roles: ['notAuthorized'] });
            const params = await tog.generateRequestParamsFromUser(actingUser);
            params.query = {};
            try {
                await userService.get(studentToRead._id, params);
                throw new Error('should have failed');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed');
                // https://ticketsystem.schul-cloud.org/browse/SC-5076
                // expect(err.message).to.equal(testGenericErrorMessage);
                expect(err.code).to.equal(403);
            }
        });

        it('teacher can read student', async () => {
            const { user: teacher } = await tog.createTestUserAndAccount({ roles: ['teacher'] });
            const student = await tog.createTestUser({ roles: ['student'], birthday: Date.now() });
            const params = await tog.generateRequestParamsFromUser(teacher);
            params.query = {};
            const result = await userService.get(student._id, params);
            expect(result).to.not.be.undefined;
            expect(result).to.haveOwnProperty('firstName');
            expect(result).to.haveOwnProperty('lastName');
            expect(result).to.haveOwnProperty('displayName');
            expect(result).not.to.haveOwnProperty('ldapId');
        });

        // https://ticketsystem.schul-cloud.org/browse/SC-5163
        // See linked implementation issue if needed!
        xit('teacher can not read other teacher', async () => {
            const teacher = await tog.createTestUser({ roles: ['teacher'] });
            const otherTeacher = await tog.createTestUser({ roles: ['teacher'] });
            const params = await tog.generateRequestParamsFromUser(teacher);
            params.query = {};
            try {
                await userService.get(otherTeacher._id, params);
                throw new Error('should have failed');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed');
                expect(err.message).to.equal(testGenericErrorMessage);
                expect(err.code).to.equal(403);
            }
        });

        // https://ticketsystem.schul-cloud.org/browse/SC-5163
        // See linked implementation issue if needed!
        xit('teacher can not read admin', async () => {
            const teacher = await tog.createTestUser({ roles: ['teacher'] });
            const params = await tog.generateRequestParamsFromUser(teacher);
            params.query = {};
            try {
                await userService.get('0000d213816abba584714c0a', params); // admin user id
                throw new Error('should have failed');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed');
                expect(err.message).to.equal(testGenericErrorMessage);
                expect(err.code).to.equal(403);
            }
        });

        // https://ticketsystem.schul-cloud.org/browse/SC-5163
        // See linked implementation issue if needed!
        xit('teacher can not read superhero', async () => {
            const teacher = await tog.createTestUser({ roles: ['teacher'] });
            const params = await tog.generateRequestParamsFromUser(teacher);
            params.query = {};
            try {
                await userService.get('0000d231816abba584714c9c', params); // superhero user id
                throw new Error('should have failed');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed');
                expect(err.message).to.equal(testGenericErrorMessage);
                expect(err.code).to.equal(403);
            }
        });

        it('teacher can not read student from foreign school', async () => {
            await tog.createTestRole({
                name: 'studentList',
                permissions: ['STUDENT_LIST'],
            });
            const school = await tog.createTestSchool({
                name: 'testSchool1',
            });
            const otherSchool = await tog.createTestSchool({
                name: 'testSchool2',
            });
            const { user: student } = await tog.createTestUserAndAccount({ roles: ['teacher'], schoolId: school._id });
            const otherStudent = await tog.createTestUser({ roles: ['student'], schoolId: otherSchool._id });
            const params = await tog.generateRequestParamsFromUser(student);
            params.query = {};
            try {
                await userService.get(otherStudent._id, params);
                throw new Error('should have failed');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed');
                expect(err.message).to.equal(testGenericErrorMessage);
                expect(err.code).to.equal(403);
            }
        });

        it('should throws an error, when performing GET with populate in query params', async () => {
            const { user: student } = await tog.createTestUserAndAccount({
                roles: ['student'],
                birthday: Date.now(),
                ldapId: 'thisisauniqueid',
            });
            const params = await tog.generateRequestParamsFromUser(student);
            params.query = { $populate: 'not_whitelisted' };
            try {
                await userService.get(student._id, params);
                throw new Error('should have failed.');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed.');
                expect(err.message).equal('populate not supported');
                expect(err.code).to.equal(400);
            }
        });

        it('should NOT throws an error, when performing GET with whitelisted value of populate field', async () => {
            const { user: student } = await tog.createTestUserAndAccount({
                roles: ['student'],
                birthday: Date.now(),
                ldapId: 'thisisauniqueid',
            });
            const params = await tog.generateRequestParamsFromUser(student);
            params.query = { $populate: 'roles' };
            const result = await userService.get(student._id, params);
            expect(result).to.haveOwnProperty('firstName');
            expect(result).to.haveOwnProperty('lastName');
            expect(result).to.haveOwnProperty('displayName');
            expect(result).to.haveOwnProperty('email');
            expect(result).to.haveOwnProperty('birthday');
            expect(result).to.haveOwnProperty('ldapId');
        });
    });

    describe('FIND', () => {
        // https://ticketsystem.schul-cloud.org/browse/SC-3929
        it('does not allow population', async () => {
            const { user: student } = await tog.createTestUserAndAccount({ roles: ['student'] });
            const params = await tog.generateRequestParamsFromUser(student);
            params.query = {
                $populate: ['5f2987e020834114b8efd6f8', 'roles'],
            };
            try {
                await userService.find(params);
                throw new Error('should have failed');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed');
                expect(err.message).to.equal('populate not supported');
                expect(err.code).to.equal(400);
            }
        });

        it('can not populate school', async () => {
            const { _id: schoolId } = await tog.createTestSchool({});
            const { user: teacher } = await tog.createTestUserAndAccount({ roles: ['teacher'], schoolId });
            const params = await tog.generateRequestParamsFromUser(teacher);
            params.query = { $populate: ['schoolId'] };
            try {
                await userService.find(params);
                throw new Error('should have failed');
            } catch (err) {
                expect(err.message).to.not.equal('should not have failed');
                expect(err.code).to.equal(400);
                expect(err.message).to.equal('populate not supported');
            }
        });

        it('does not allow students who may not create teams list other users', async () => {
            const { user: student } = await tog.createTestUserAndAccount({ roles: ['student'] });
            const studentParams = await tog.generateRequestParamsFromUser(student);
            studentParams.query = {};

            await app.service('schools').patch(student.schoolId, { enableStudentTeamCreation: false });

            try {
                await userService.find(studentParams);
                assert.fail('students who may not create a team are not allowed to list other users');
            } catch (error) {
                expect(error.code).to.equal(403);
                expect(error.message).to.equal('The current user is not allowed to list other users!');
            }
        });

        it('allows students who may create teams list other users', async () => {
            const { user: student } = await tog.createTestUserAndAccount({ roles: ['student'] });
            const studentParams = await tog.generateRequestParamsFromUser(student);
            studentParams.query = {};
            Configuration.set('STUDENT_TEAM_CREATION', 'enabled');

            await app.service('schools').patch(student.schoolId, { enableStudentTeamCreation: true });

            const studentResults = await userService.find(studentParams);
            expect(studentResults.data).to.be.not.empty;
        });
    });

    describe('CREATE', () => {
        it('can create student with STUDENT_CREATE', async () => {
            const { _id: schoolId } = await tog.createTestSchool();
            await tog.createTestRole({
                name: 'studentCreate',
                permissions: ['STUDENT_CREATE'],
            });
            const { user: actingUser } = await tog.createTestUserAndAccount({ roles: ['studentCreate'], schoolId });
            const params = await tog.generateRequestParamsFromUser(actingUser);
            const data = {
                firstName: 'Luke',
                lastName: 'Skywalker',
                schoolId,
                roles: ['student'],
                email: `${Date.now()}@test.org`,
            };
            const result = await userService.create(data, params);
            expect(result).to.not.be.undefined;
            expect(result._id).to.not.be.undefined;
            tog.createdEntityIds.users.push(result._id);
        });

        it('can fails to create user on other school', async () => {
            const { _id: schoolId } = await tog.createTestSchool();
            const { _id: otherSchoolId } = await tog.createTestSchool();
            await tog.createTestRole({
                name: 'studentCreate',
                permissions: ['STUDENT_CREATE'],
            });
            const { user: actingUser } = await tog.createTestUserAndAccount({ roles: ['studentCreate'], schoolId });
            const params = await tog.generateRequestParamsFromUser(actingUser);
            const data = {
                firstName: 'Leia',
                lastName: 'Skywalker',
                schoolId: otherSchoolId,
                roles: ['student'],
                email: `${Date.now()}@test.org`,
            };
            try {
                await userService.create(data, params);
                throw new Error('should have failed');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed');
                expect(err.code).to.equal(403);
                expect(err.message).to.equal('You do not have valid permissions to access this.');
            }
        });

        it('superhero can create admin', async () => {
            const { user: hero } = await tog.createTestUserAndAccount({ roles: ['superhero'] });
            const { _id: schoolId } = await tog.createTestSchool();
            const params = await tog.generateRequestParamsFromUser(hero);
            const user = await userService.create(
                    {
                        schoolId,
                        email: `${Date.now()}@testadmin.org`,
                        firstName: 'Max',
                        lastName: 'Tester',
                        roles: ['administrator'],
                    },
                    params
            );
            expect(user).to.not.equal(undefined);
            expect(user._id).to.not.equal(undefined);
            tog.createdEntityIds.users.push(user._id);
        });

        it('should throws an error, when performing CREATE with populate in query params', async () => {
            const { user: hero } = await tog.createTestUserAndAccount({ roles: ['superhero'] });
            const { _id: schoolId } = await tog.createTestSchool();
            const params = await tog.generateRequestParamsFromUser(hero);

            params.query = { $populate: 'not_whitelisted' };
            try {
                await userService.create(
                        {
                            schoolId,
                            email: `${Date.now()}@testadmin.org`,
                            firstName: 'Max',
                            lastName: 'Tester',
                            roles: ['administrator'],
                        },
                        params
                );
                throw new Error('should have failed.');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed.');
                expect(err.message).equal('populate not supported');
                expect(err.code).to.equal(400);
            }
        });
    });

    describe('PATCH', () => {
        it('rejects on group patching', async () => {
            await userService.patch(null, { email: 'test' }).catch((err) => {
                expect(err).to.not.equal(undefined);
                expect(err.message).to.equal('Operation on this service requires an id!');
            });
        });

        it('student can edit himself', async () => {
            const { user: student } = await tog.createTestUserAndAccount({ roles: ['student'] });
            const params = await tog.generateRequestParamsFromUser(student);
            params.query = {};
            const result = await userService.patch(student._id, { firstName: 'Bruce' }, params);
            expect(result).to.not.be.undefined;
            expect(result.firstName).to.equal('Bruce');
        });

        it('fail to patch user on other school', async () => {
            const school = await tog.createTestSchool();
            const otherSchool = await tog.createTestSchool();
            const studentToDelete = await tog.createTestUser({ roles: ['student'], schoolId: otherSchool._id });
            const { user: actingUser } = await tog.createTestUserAndAccount({
                roles: ['administrator'],
                schoolId: school._id
            });
            const params = await tog.generateRequestParamsFromUser(actingUser);

            try {
                await userService.patch(studentToDelete._id, { lastName: 'Vader' }, params);
                throw new Error('should have failed');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed');
                expect(err.code).to.equal(404);
                expect(err.message).to.equal(`no record found for id '${studentToDelete._id.toString()}'`);
            }
        });

        it('should throws an error, when performing PATCH with populate in query params', async () => {
            const { user: student } = await tog.createTestUserAndAccount({
                roles: ['student'],
                birthday: Date.now(),
                ldapId: 'thisisauniqueid',
            });
            const params = await tog.generateRequestParamsFromUser(student);
            params.query = { $populate: 'not_whitelisted' };
            try {
                await userService.patch(student._id, { lastName: 'Vader' }, params);
                throw new Error('should have failed.');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed.');
                expect(err.message).equal('populate not supported');
                expect(err.code).to.equal(400);
            }
        });
    });

    describe('REMOVE', () => {
        it('user gets removed from classes and courses after delete', async () => {
            const userToDelete = await tog.createTestUser({ roles: ['student'], manualCleanup: true });
            const userId = userToDelete._id.toString();
            const { _id: classId } = await tog.createTestClass({ userIds: userToDelete._id });
            const { _id: courseId } = await tog.createTestCourse({ userIds: userToDelete._id });

            await userService.remove(userId);

            const [course, klass] = await Promise.all([coursesService.get(courseId), classesService.get(classId)]);

            expect(course.userIds.map((id) => id.toString())).to.not.include(userId);
            expect(klass.userIds.map((id) => id.toString())).to.not.include(userId);
        });

        it('fail to delete single student without STUDENT_DELETE permission', async () => {
            await tog.createTestRole({ name: 'notAuthorized', permissions: [] });
            const studentToDelete = await tog.createTestUser({ roles: ['student'] });
            const { user: actingUser } = await tog.createTestUserAndAccount({ roles: ['notAuthorized'] });
            const params = await tog.generateRequestParamsFromUser(actingUser);
            params.query = {};
            params.headers = { 'x-api-key': Configuration.get('CLIENT_API_KEY') }; // toDO remove with SC-4112
            try {
                await userService.remove(studentToDelete._id, params);
                throw new Error('should have failed');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed');
                expect(err.code).to.equal(403);
                expect(err.message).to.equal('you dont have permission to delete this user!');
            }
        });

        it('can delete single student with STUDENT_DELETE permission', async () => {
            await tog.createTestRole({
                name: 'studentDelete',
                permissions: ['STUDENT_DELETE'],
            });
            const studentToDelete = await tog.createTestUser({ roles: ['student'], manualCleanup: true });
            const { user: actingUser } = await tog.createTestUserAndAccount({ roles: ['studentDelete'] });
            const params = await tog.generateRequestParamsFromUser(actingUser);
            params.query = {};
            params.headers = { 'x-api-key': Configuration.get('CLIENT_API_KEY') }; // toDO remove with SC-4112

            const result = await userService.remove(studentToDelete._id, params);
            expect(result).to.not.be.undefined;
            expect(result._id.toString()).to.equal(studentToDelete._id.toString());
        });

        it('fail to  single teacher without TEACHER_DELETE permission', async () => {
            await tog.createTestRole({ name: 'notAuthorized', permissions: ['STUDENT_DELETE'] });
            const studentToDelete = await tog.createTestUser({ roles: ['teacher'] });
            const { user: actingUser } = await tog.createTestUserAndAccount({ roles: ['notAuthorized'] });
            const params = await tog.generateRequestParamsFromUser(actingUser);
            params.query = {};
            params.headers = { 'x-api-key': Configuration.get('CLIENT_API_KEY') }; // toDO remove with SC-4112
            try {
                await userService.remove(studentToDelete._id, params);
                throw new Error('should have failed');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed');
                expect(err.code).to.equal(403);
                expect(err.message).to.equal('you dont have permission to delete this user!');
            }
        });

        it('can delete single teacher with TEACHER_DELETE permission', async () => {
            await tog.createTestRole({
                name: 'teacherDelete',
                permissions: ['TEACHER_DELETE'],
            });
            const studentToDelete = await tog.createTestUser({ roles: ['teacher'], manualCleanup: true });
            const { user: actingUser } = await tog.createTestUserAndAccount({ roles: ['teacherDelete'] });
            const params = await tog.generateRequestParamsFromUser(actingUser);
            params.query = {};
            params.headers = { 'x-api-key': Configuration.get('CLIENT_API_KEY') }; // toDO remove with SC-4112
            const result = await userService.remove(studentToDelete._id, params);
            expect(result).to.not.be.undefined;
            expect(result._id.toString()).to.equal(studentToDelete._id.toString());
        });

        it('fail to delete user on other school', async () => {
            const school = await tog.createTestSchool();
            const otherSchool = await tog.createTestSchool();
            const studentToDelete = await tog.createTestUser({ roles: ['student'], schoolId: otherSchool._id });
            const { user: actingUser } = await tog.createTestUserAndAccount({
                roles: ['administrator'],
                schoolId: school._id
            });
            const params = await tog.generateRequestParamsFromUser(actingUser);
            params.query = {};
            try {
                await userService.remove(studentToDelete._id, params);
                throw new Error('should have failed');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed');
                expect(err.code).to.equal(404);
                expect(err.message).to.equal(`no record found for id '${studentToDelete._id.toString()}'`);
            }
        });

        it('should throws an error, when performing REMOVE with populate in query params', async () => {
            await tog.createTestRole({
                name: 'studentDelete',
                permissions: ['STUDENT_DELETE'],
            });
            const studentToDelete = await tog.createTestUser({ roles: ['student'] });
            const { user: actingUser } = await tog.createTestUserAndAccount({ roles: ['studentDelete'] });
            const params = await tog.generateRequestParamsFromUser(actingUser);
            params.query = { $populate: 'not_whitelisted' };
            params.headers = { 'x-api-key': Configuration.get('CLIENT_API_KEY') }; // toDO remove with SC-4112
            try {
                await userService.remove(studentToDelete._id, params);
                throw new Error('should have failed.');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed.');
                // in case of error, make sure user gets deleted
                expect(err.message).equal('populate not supported');
                expect(err.code).to.equal(400);
            }
        });
    });

    describe('bulk delete', () => {
        it('can delete multiple students when user has STUDENT_DELETE permission', async () => {
            await tog.createTestRole({
                name: 'studentDelete',
                permissions: ['STUDENT_DELETE'],
            });
            const userIds = await Promise.all([
                tog.createTestUser({ roles: ['student'], manualCleanup: true }).then((u) => u._id),
                tog.createTestUser({ roles: ['student'], manualCleanup: true }).then((u) => u._id),
            ]);
            const { user: actingUser } = await tog.createTestUserAndAccount({ roles: ['studentDelete'] });
            const params = await tog.generateRequestParamsFromUser(actingUser);
            params.query = { _id: { $in: userIds } };
            params.headers = { 'x-api-key': Configuration.get('CLIENT_API_KEY') }; // toDO remove with SC-4112
            let result;
            try {
                result = await userService.remove(null, params);
            } catch (err) {
                tog.createdUserIds.concat(userIds);
                throw new Error('should not have failed', err);
            }
            expect(result).to.not.be.undefined;
            expect(Array.isArray(result)).to.equal(true);
            const resultUserIds = result.map((e) => e._id.toString());
            userIds.forEach((userId) => expect(resultUserIds).to.include(userId.toString()));
        });

        it('only deletes students when user has STUDENT_DELETE permission', async () => {
            await tog.createTestRole({
                name: 'studentDelete',
                permissions: ['STUDENT_DELETE'],
            });
            const userIds = await Promise.all([
                tog.createTestUser({ roles: ['student'], manualCleanup: true }).then((u) => u._id),
                tog.createTestUser({ roles: ['teacher'] }).then((u) => u._id),
            ]);
            const { user: actingUser } = await tog.createTestUserAndAccount({ roles: ['studentDelete'] });
            const params = await tog.generateRequestParamsFromUser(actingUser);
            params.query = { _id: { $in: userIds } };
            params.headers = { 'x-api-key': Configuration.get('CLIENT_API_KEY') }; // toDO remove with SC-4112
            let result;
            try {
                result = await userService.remove(null, params);
            } catch (err) {
                tog.createdUserIds.concat(userIds);
                throw new Error('should not have failed', err);
            }
            expect(result).to.not.be.undefined;
            expect(Array.isArray(result)).to.equal(true);
            const resultUserIds = result.map((e) => e._id.toString());
            expect(resultUserIds).to.include(userIds[0].toString());
            expect(resultUserIds).to.not.include(userIds[1].toString());
        });
    });

    describe('uniqueness check', () => {
        it('should reject new users with mixed-case variants of existing usernames', async () => {
            await tog.createTestUser({ email: 'existing@account.de' });
            try {
                const newUser = {
                    firstName: 'Test',
                    lastName: 'Testington',
                    email: 'ExistinG@aCCount.de',
                    schoolId: '5f2987e020834114b8efd6f8',
                };
                await tog.createTestUser(newUser);
                expect.fail('previous call should have failed');
            } catch (e) {
                expect(e.message).to.equal(`Die E-Mail Adresse ist bereits in Verwendung!`);
            }
        });
    });
});
