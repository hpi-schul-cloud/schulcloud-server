const { expect } = require('chai');

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
		testData = {
			school,
			courseTeacher,
			courseStudent,
			teacherRequestAuthentication,
			studentRequestAuthentication,
			course,
		};
	});

	it('fails with school feature disabled', async () => {
		const createOptions = {
			scopeId: testData.course.id,
			scopeName: 'course',
		};
		expect(() => createService
			.create(createOptions, testData.teacherRequestAuthentication), 'feature probably enabled in school').to.throw;
	});

	it('succeds with school feature enabled', async () => {
		const createOptions = {
			scopeId: testData.course.id,
			scopeName: 'course',
		};
		testData.school.features.push(VIDEOCONFERENCE);
		await testData.school.save();
		const response = await createService.create(createOptions, testData.teacherRequestAuthentication);
		expect(response.SUCCESS, 'feature probably disabled in school').to.be.equal('SUCCESS');
	});

	// // scope permission tests
	// it('test creation with start permission works', () => { });
	// it('test creation with join permission fails', () => { });
	// it('test join with start permission works', () => { });
	// it('test join with join permission works', () => { });
	// it('test without permission', () => { });

	after('cleanup', testObjects.cleanup);
	after((done) => {
		server.close(done);
	});
});
