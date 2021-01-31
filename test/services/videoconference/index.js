/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const rp = require('request-promise-native');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise);

const { generateRequestParamsFromUser } = require('../helpers/services/login')(appPromise);

const { schoolModel: Schools } = require('../../../src/services/school/schools.model');
const { SCHOOL_FEATURES } = require('../../../src/services/school/schools.model');
const { PERMISSIONS: VIDEOCONFERENCE_PERMISSIONS } = require('../../../src/services/videoconference/logic/constants');
const Roles = require('../../../src/services/role/model');

const { Configuration } = require('@hpi-schul-cloud/commons');

const getServiceRespondsDependingOnUserPermissions = async (testData) => {
    const app = await appPromise;
    const getService = app.service('videoconference/:scopeName');

    it('test get with start or join permission works after creation', async () => {
        // expect creation finished like above...
        const teacherResponse = getService.get(testData.serviceParams.scopeId, {
            route: { scopeName: testData.serviceParams.scopeName },
            ...testData.teacherRequestAuthentication,
        });
        const substitutionTeacherResponse = getService.get(testData.serviceParams.scopeId, {
            route: { scopeName: testData.serviceParams.scopeName },
            ...testData.substitutionTeacherRequestAuthentication,
        });
        const courseStudentResponse = getService.get(testData.serviceParams.scopeId, {
            route: { scopeName: testData.serviceParams.scopeName },
            ...testData.studentRequestAuthentication,
        });
        let successCounter = 0;
        await Promise.all([teacherResponse, substitutionTeacherResponse, courseStudentResponse]).then(
                ([...serviceResponses]) =>
                        Promise.all(
                                serviceResponses.map((serviceResponse) => {
                                    expect(serviceResponse.status).to.be.equal('SUCCESS');
                                    expect(serviceResponse.url).to.be.undefined;
                                    successCounter += 1;
                                    return successCounter;
                                })
                        )
        );
        expect(successCounter).to.be.equal(3);
        return Promise.resolve(successCounter);
    });
};

const expectNoCreatePermission = async (testData) => {
    const app = await appPromise;
    const createService = app.service('videoconference');
    expect(() => createService.create(testData.serviceParams), 'no authentication should fail').to.throw;
    expect(
            () => createService.create(testData.serviceParams, testData.someUserAuth),
            'missing scope permission should fail'
    ).to.throw;
};

const expectNoGetPermission = async (testData) => {
    const app = await appPromise;
    const getService = app.service('videoconference/:scopeName');
    expect(() =>
            getService.get(testData.serviceParams.scopeId, {
                route: { scopeName: testData.serviceParams.scopeName },
                ...testData.someUserAuth,
            })
    ).to.throw;
    expect(() =>
            getService.get(testData.serviceParams.scopeId, {
                route: { scopeName: testData.serviceParams.scopeName },
                // no user
            })
    ).to.throw;
};

describe.skip('videoconference service', function slowServiceTests() {
    let app;
    let createService;
    let getService;

    let testData = null;
    let server;

    before('create test objects', async () => {
        app = await appPromise;
        createService = app.service('videoconference');
        getService = app.service('videoconference/:scopeName');
        server = await app.listen();

        let school = await testObjects.createTestSchool();
        const { _id: schoolId } = school;
        const courseTeacher = await testObjects.createTestUser({
            roles: ['teacher'],
            schoolId,
            firstName: 'teacher',
        });
        const someUser = await testObjects.createTestUser({
            roles: ['teacher'],
            schoolId,
            firstName: 'a user',
        });
        const coursesubstitutionTeacher = await testObjects.createTestUser({
            roles: ['teacher'],
            schoolId,
            firstName: 'substitutionteacher',
        });
        const courseStudent = await testObjects.createTestUser({
            roles: ['student'],
            schoolId,
            firstName: 'student',
        });
        const teacherRequestAuthentication = await generateRequestParamsFromUser(courseTeacher);
        const someUserAuth = await generateRequestParamsFromUser(someUser);
        const substitutionTeacherRequestAuthentication = await generateRequestParamsFromUser(coursesubstitutionTeacher);
        const studentRequestAuthentication = await generateRequestParamsFromUser(courseStudent);
        const course = await testObjects.createTestCourse({
            name: 'test videoconference course',
            userIds: [courseStudent._id],
            teacherIds: [courseTeacher._id],
            substitutionIds: [coursesubstitutionTeacher._id],
        });
        const serviceParams = {
            scopeId: course.id,
            scopeName: 'course',
        };
        testData = {
            school,
            courseTeacher,
            courseStudent,
            someUser,
            someUserAuth,
            teacherRequestAuthentication,
            substitutionTeacherRequestAuthentication,
            studentRequestAuthentication,
            course,
            serviceParams,
        };

        // fails with school feature disabled, enables school feature and starts meeting for further tests
        expect(
                () => createService.create(testData.createOptions, testData.teacherRequestAuthentication),
                'feature should not be enabled in school'
        ).to.throw;

        // activate videoconference feature
        school = await Schools.findById(schoolId);
        school.features.push(SCHOOL_FEATURES.VIDEOCONFERENCE);
        await school.save();

        const roleTeacher = await Roles.findById(courseTeacher.roles[0]);
        roleTeacher.permissions.push(VIDEOCONFERENCE_PERMISSIONS.START_MEETING);
        await roleTeacher.save();

        Configuration.set('FEATURE_VIDEOCONFERENCE_ENABLED', true);
    });

    describe('A - not started', () => {
        it('get service works', async () => {
            await getServiceRespondsDependingOnUserPermissions(testData);
        });

        it('test without permissions should fail', async () => {
            await expectNoGetPermission(testData);
            await expectNoCreatePermission(testData);
        });

        it('expect join works not for students upon creation', async () => {
            const studentResponse = await createService.create(testData.serviceParams, testData.studentRequestAuthentication);
            expect(
                    studentResponse.status,
                    'students should not have the permission to join a not started videoconference in courses'
            ).not.to.be.equal('NOT_STARTED');
            expect(
                    studentResponse.url,
                    'students should not have the permission to join a not started videoconference in courses'
            ).to.be.undefined;
        });
    });

    describe('B - has been started', () => {
        before('start the conference', async () => {
            const response = await createService.create(testData.serviceParams, testData.teacherRequestAuthentication);
            expect(response).to.be.ok;
            expect(response.status).to.be.equal('SUCCESS');
            expect(response.url).to.be.not.empty;
        });

        it('get service works', async () => {
            await getServiceRespondsDependingOnUserPermissions(testData);
        });

        it('test without permissions should fail', async () => {
            await expectNoGetPermission(testData);
            await expectNoCreatePermission(testData);
        });

        it('join works for authenticated roles', async () => {
            const studentResponse = await createService.create(testData.serviceParams, testData.studentRequestAuthentication);
            expect(
                    studentResponse.url,
                    'students should not have the permission to join a started videoconference in courses'
            ).not.to.be.empty;

            const substitutionteacherResponse = await createService.create(
                    testData.serviceParams,
                    testData.substitutionTeacherRequestAuthentication
            );
            expect(
                    substitutionteacherResponse.url,
                    'substitutionteachers should be able to start a videoconference in courses'
            ).not.to.be.empty;

            const teacherSecondResponse = await createService.create(
                    testData.serviceParams,
                    testData.teacherRequestAuthentication
            );
            expect(teacherSecondResponse.url, 'teachers should be able to start a videoconference in courses again (=join)')
                    .not.to.be.empty;
        });

        describe('bbb mass request tests', () => {
            it('test get works multiple times', async () => {
                let successfulRuns = 0;
                const courseStudents = [];
                const studentIds = [];

                for (let i = 0; i < 20; i += 1) {
                    const student = await testObjects.createTestUser({
                        roles: ['student'],
                        schoolId: testData.school.id,
                        firstName: 'student',
                    });
                    studentIds.push(student.id);
                    const authentication = await generateRequestParamsFromUser(student);
                    courseStudents.push({ student, authentication });
                }
                studentIds.forEach((userId) => testData.course.userIds.push(userId));
                await testData.course.save();

                for (let i = 0; i < 20; i += 1) {
                    const response = await getService.get(testData.serviceParams.scopeId, {
                        route: { scopeName: testData.serviceParams.scopeName },
                        ...courseStudents[i].authentication,
                    });
                    expect(response).to.be.ok;
                    expect(response.status).to.be.equal('SUCCESS');
                    expect(response.url).to.be.undefined;
                    successfulRuns += 1;
                }
                expect(successfulRuns).to.be.equal(20);
                return Promise.resolve();
            });

            it('test join works multiple times [TODO]', async () => {
                let successfulRuns = 0;
                const authenticated = [];
                const courseStudents = [];
                const studentIds = [];

                for (let i = 0; i < 20; i += 1) {
                    const student = await testObjects.createTestUser({
                        roles: ['student'],
                        schoolId: testData.school.id,
                        firstName: 'student',
                    });
                    studentIds.push(student.id);
                    const authentication = await generateRequestParamsFromUser(student);
                    courseStudents.push({ student, authentication });
                }
                studentIds.forEach((userId) => testData.course.userIds.push(userId));
                await testData.course.save();

                for (let i = 0; i < 20; i += 1) {
                    const response = await createService.create(testData.serviceParams, courseStudents[i].authentication);
                    expect(response).to.be.ok;
                    expect(response.status).to.be.equal('SUCCESS');
                    expect(response.url).to.be.not.empty;
                    authenticated.push(rp(response.url));
                    successfulRuns += 1;
                }
                expect(successfulRuns).to.be.equal(20);
                // expect all requests finish successfully
                return Promise.all(authenticated);
            });
        });
    });

    describe('team events', () => {
        before('create team event, enable videoconference', async () => {
            // const { team, user } = await testObjects.createTestTeamWithOwner();
            // const event = await testObjects.createTestEvent();
        });
    });

    after(async () => {
        await server.close();
    });
    after('cleanup', testObjects.cleanup);
});
