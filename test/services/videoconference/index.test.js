const { expect } = require('chai');
const rp = require('request-promise-native');
const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);

const { generateRequestParamsFromUser } = require('../helpers/services/login')(app);

const createService = app.service('videoconference');
// const getService = app.service('videoconference/:scopeName/:scopeId');

const { VIDEOCONFERENCE } = require('../../../src/services/school/model').SCHOOL_FEATURES;

describe.only('videoconference service', () => {
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
		const courseStudent = await testObjects.createTestUser({
			roles: ['student'],
			schoolId,
			firstName: 'student',
		});
		const teacherRequestAuthentication = await generateRequestParamsFromUser(courseTeacher);
		const studentRequestAuthentication = await generateRequestParamsFromUser(courseStudent);
		const course = await testObjects.createTestCourse({
			name: 'test videoconference course',
			userIds: [courseStudent.id],
			teacherIds: [courseTeacher.id],
		});
		const createOptions = {
			scopeId: course.id,
			scopeName: 'course',
		};
		testData = {
			school,
			courseTeacher,
			courseStudent,
			teacherRequestAuthentication,
			studentRequestAuthentication,
			course,
			createOptions,
		};
	});

	it('fails with school feature disabled, enables school feature for further tests', async () => {
		expect(() => createService
			.create(testData.reateOptions, testData.teacherRequestAuthentication), 'feature probably enabled in school')
			.to.throw;
		testData.school.features.push(VIDEOCONFERENCE);
		await testData.school.save();
		const response = await createService.create(testData.createOptions, testData.teacherRequestAuthentication);
		expect(response, 'feature probably disabled in school').to.be.ok;
		expect(response.status).to.be.equal('SUCCESS');
		expect(response.url).to.be.ok;
	});

	it('test creation with start permission works multiple times', async () => {
		let successfulRuns = 0;
		for (let i = 0; i < 20; i += 1) {
			const response = await createService.create(testData.createOptions, testData.teacherRequestAuthentication);
			expect(response, 'feature probably disabled in school').to.be.ok;
			expect(response.status).to.be.equal('SUCCESS');
			expect(response.url).to.be.ok;
			const authenticated = await rp(response.url);
			expect(authenticated).to.be.ok;
			successfulRuns += 1;
		}
		expect(successfulRuns).to.be.equal(20);
	});


	// // scope permission tests
	// it('test creation with join permission fails', () => { });
	// it('test join with start permission works', () => { });
	// it('test join with join permission works', () => { });
	// it('test without permission', () => { });

	after('cleanup', testObjects.cleanup);
	after((done) => {
		server.close(done);
	});
});
