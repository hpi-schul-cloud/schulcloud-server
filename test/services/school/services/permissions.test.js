const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../../src/app');
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');
const schoolServices = require('../../../../src/services/school/index');
const testObjects = require('../../helpers/testObjects')(appPromise());

describe('permissons service', () => {
	let app;
	let server;
	let testSchool;
	let testUser;
	let testParams;
	let nestServices;

	before(async () => {
		app = await appPromise();
		nestServices = await setupNestServices(app);
		server = await app.listen(0);
	});
	after(async () => {
		await closeNestServices(nestServices);
		await server.close();
	});

	beforeEach(async () => {
		testSchool = await testObjects.createTestSchool();
		testUser = await testObjects.createTestUser({ schoolId: testSchool._id, roles: ['administrator'] });
		testParams = await testObjects.generateRequestParamsFromUser(testUser);
		testParams.query = {};

		app.unuse('schools');
		app.unuse('schools/api');
		app.unuse('/schools/:schoolId/maintenance');
		app.unuse('schoolGroup');
		app.unuse('gradeLevels');
		app.unuse('/school/teacher/studentvisibility');
		app.unuse('/school/student/studentlernstorevisibility');
	});
	afterEach(async () => {
		await testObjects.cleanup();
	});

	describe('for STUDENT_LIST permission', () => {
		it('is not registered if TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE is false', async () => {
			Configuration.set('TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE', 'false');
			app.configure(schoolServices);
			try {
				const service = app.service('/school/teacher/studentvisibility');
				throw new Error('service should not be registered');
			} catch (error) {
				expect(error.message).to.equal(`Can not find service 'school/teacher/studentvisibility'`);
			}
		});

		it('changes the STUDENT_LIST permission if TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE is true', async () => {
			Configuration.set('TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE', 'true');

			app.configure(schoolServices);

			const service = app.service('/school/teacher/studentvisibility');
			expect(service).to.not.be.undefined;

			expect(testSchool.permissions.teacher.STUDENT_LIST).to.be.true;

			const data = { permission: { isEnabled: false } };
			const result = await service.patch(null, data, testParams);
			await expect(result.permissions).to.deep.include({
				teacher: { STUDENT_LIST: false },
			});
		});
	});

	describe('for LERNSTORE_VIEW permission', () => {
		it('is not registered if FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED is false', async () => {
			Configuration.set('FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED', 'false');
			app.configure(schoolServices);

			try {
				const service = app.service('/school/student/studentlernstorevisibility');
				throw new Error('service should not be registered');
			} catch (error) {
				expect(error.message).to.equal(`Can not find service 'school/student/studentlernstorevisibility'`);
			}
		});

		it('changes the LERNSTORE_VIEW permission if FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED is true', async () => {
			Configuration.set('FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED', 'true');
			app.configure(schoolServices);

			const service = app.service('/school/student/studentlernstorevisibility');
			expect(service).to.not.be.undefined;

			expect(testSchool.permissions.student).to.be.undefined;

			const data = { permission: { isEnabled: false } };
			const result = await service.patch(null, data, testParams);
			await expect(result.permissions).to.deep.include({
				student: { LERNSTORE_VIEW: false },
			});
		});
	});
});
