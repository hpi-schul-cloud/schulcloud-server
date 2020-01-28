const { expect } = require('chai');
const rp = require('request-promise-native');
const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);

const { generateRequestParamsFromUser } = require('../helpers/services/login')(app);

const createService = app.service('videoconference');
const getService = app.service('videoconference/:scopeName');

const { VIDEOCONFERENCE } = require('../../../src/services/school/model').SCHOOL_FEATURES;

describe.only('videoconference service', function slowServiceTests() {
	this.timeout(10000);

	let testData = null;
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	before('create test objects', async () => {
		const school = await testObjects.createTestSchool();
		const { id: schoolId } = school;
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
			userIds: [courseStudent.id],
			teacherIds: [courseTeacher.id],
			substitutionIds: [coursesubstitutionTeacher.id],
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
	});

	it('fails with school feature disabled, enables school feature for further tests', async () => {
		expect(() => createService
			.create(testData.reateOptions, testData.teacherRequestAuthentication), 'feature probably enabled in school')
			.to.throw;
		testData.school.features.push(VIDEOCONFERENCE);
		await testData.school.save();
		const response = await createService.create(testData.serviceParams, testData.teacherRequestAuthentication);
		expect(response).to.be.ok;
		expect(response.status).to.be.equal('SUCCESS');
		expect(response.url).to.be.not.empty;
	});

	it('test creation with start permission works multiple times [slow]', async () => {
		let successfulRuns = 0;
		const authenticated = [];
		for (let i = 0; i < 20; i += 1) {
			const response = await createService.create(testData.serviceParams, testData.teacherRequestAuthentication);
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

	it('test creation with join permission (student in courses) fails', () => {
		expect(() => createService
			.create(testData.serviceParams, testData.studentRequestAuthentication),
			'students should not have the permission to start a videoconference in courses')
			.to.throw;
	});
	it('test creation as substitution teacher works', () => {
		expect(() => createService
			.create(testData.serviceParams, testData.substitutionTeacherRequestAuthentication),
			'substitutionteachers should be able to start a videoconference in courses')
			.not.to.throw;
	});

	it('test creation without permission fails', () => {
		expect(() => createService
			.create(testData.serviceParams), 'no authentication should fail')
			.to.throw;
		expect(() => createService
			.create(testData.serviceParams, testData.someUserAuth), 'missing scope permission should fail')
			.to.throw;
	});

	it('test get with start or join permission works after creation', async () => {
		// expect creation finished like above...
		const teacherResponse = getService
			.get(testData.serviceParams.scopeId, {
				route: { scopeName: testData.serviceParams.scopeName },
				...testData.teacherRequestAuthentication,
			});
		const substitutionTeacherResponse = getService
			.get(testData.serviceParams.scopeId, {
				route: { scopeName: testData.serviceParams.scopeName },
				...testData.substitutionTeacherRequestAuthentication,
			});
		const courseStudentResponse = getService
			.get(testData.serviceParams.scopeId, {
				route: { scopeName: testData.serviceParams.scopeName },
				...testData.studentRequestAuthentication,
			});
		return Promise.all([teacherResponse, substitutionTeacherResponse, courseStudentResponse])
			.then((responses) => responses.forEach((response) => {
				expect(response.status).to.be.equal('SUCCESS');
				expect(response.url).to.be.not.empty;
				return rp(response.url).then((authenticated) => {
					expect(authenticated).to.be.not.empty;
					return Promise.resolve();
				});
			}));
	});

	it('test join permission (student in courses) works multiple times', async () => {
		let successfulRuns = 0;
		const chain = [];
		const runs = 2;
		for (let i = 0; i < runs; i += 1) {
			// add new user into course and let it join the meeting
			const someStudentInCourse = await testObjects.createTestUser({
				roles: ['student'],
				schoolId: testData.school.id,
				firstName: 'a user in course',
				lastName: `num_${i}`,
			});
			testData.course.userIds.push(someStudentInCourse.id);
			await testData.course.save();
			const auth = await generateRequestParamsFromUser(someStudentInCourse);

			const promise = getService
				.get(testData.serviceParams.scopeId, {
					route: { scopeName: testData.serviceParams.scopeName },
					...auth,
				}).then((response) => {
					expect(response).to.be.ok;
					expect(response.status).to.be.equal('SUCCESS');
					expect(response.url).to.be.not.empty;
					return rp(response.url);
				}).then((authenticated) => {
					expect(authenticated).to.be.not.empty;
					return Promise.resolve();
				});
			chain.push(promise);
			successfulRuns += 1;
		}
		expect(successfulRuns).to.be.equal(runs);
		// expect all requests finish successfully
		return Promise.all(chain);
	});

	it('test info/get without permission fails', () => {
		// todo this (throw) is not working as expected here and above!!!
		expect(() => getService
			.get(testData.serviceParams.scopeId, {
				route: { scopeName: testData.serviceParams.scopeName },
			}), 'not authenticated access should be restricted').to.throw;
		expect(() => getService
			.get(testData.serviceParams.scopeId, {
				route: { scopeName: testData.serviceParams.scopeName },
				...testData.someUserAuth,
			}), 'other users hould not have access to join').to.throw;
	});

	after((done) => {
		server.close(done);
	});
	after('cleanup', testObjects.cleanup);
});
