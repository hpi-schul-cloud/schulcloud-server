const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../../src/app');
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');
const schoolServices = require('../../../../src/services/school/index');
const testObjects = require('../../helpers/testObjects');

describe('permissons service', () => {
	let app;
	let server;
	let testHelper;
	let testSchool;
	let testUser;
	let testParams;
	let nestServices;

	before(async () => {
		app = await appPromise();
		nestServices = await setupNestServices(app);
		testHelper = testObjects(appPromise());
		server = await app.listen(0);
		testSchool = await testHelper.createTestSchool({
			permissions: { teacher: { STUDENT_LIST: true } },
		});
		testUser = await testHelper.createTestUser({ schoolId: testSchool._id, roles: ['administrator'] });
		testParams = await testHelper.generateRequestParamsFromUser(testUser);
		testParams.query = {};
	});

	beforeEach(() => {
		delete app.services['school/student/studentlernstorevisibility'];
		delete app.services['school/teacher/studentvisibility'];
	});

	after(async () => {
		await testHelper.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	describe('for STUDENT_LIST permission', () => {
		it('is not registered if TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE is false', async () => {
			Configuration.set('TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE', 'false');
			app.configure(schoolServices);

			const service = app.service('/school/teacher/studentvisibility');
			expect(service).to.be.undefined;
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

			const service = app.service('/school/student/studentlernstorevisibility');
			expect(service).to.be.undefined;
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
