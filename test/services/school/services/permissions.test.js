const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects');
const { Forbidden } = require('../../../../src/errors');
const { HandlePermissions, handlePermissionsHooks } = require('../../../../src/services/school/services/permissions');

describe('permissons service', () => {
	let app;
	let server;
	let service;
	let testHelper;
	let testSchool;
	let testUser;
	let testParams;

	before(async () => {
		app = await appPromise;
		testHelper = testObjects(appPromise);
		server = await app.listen(0);
		testSchool = await testHelper.createTestSchool();
		testUser = await testHelper.createTestUser({ schoolId: testSchool._id, roles: ['administrator'] });
		testParams = await testHelper.generateRequestParamsFromUser(testUser);
		testParams.query = {};
	});

	after(async () => {
		await testHelper.cleanup();
		await server.close();
	});

	describe('for STUDENT_LIST permission', () => {
		before(async () => {
			app.use('/school/teacher/studentvisibility', new HandlePermissions('teacher', 'STUDENT_LIST'));
			service = app.service('/school/teacher/studentvisibility');
			service.hooks(handlePermissionsHooks);
		});

		it('registered the service', () => {
			expect(service).to.not.be.null;
		});

		describe('patch', () => {
			it('throws Forbidden if TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE is false', async () => {
				Configuration.set('TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE', 'false');

				await expect(service.patch(null, {}, testParams)).to.be.rejectedWith(Forbidden);
			});

			it('changes the STUDENT_LIST permission if TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE is true', async () => {
				Configuration.set('TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE', 'true');

				expect(testSchool.permissions.teacher.STUDENT_LIST).to.be.true;

				const data = { permission: { isEnabled: false } };
				const result = await service.patch(null, data, testParams);
				await expect(result.permissions).to.deep.include({
					teacher: { STUDENT_LIST: false },
				});
			});
		});
	});

	describe('for LERNSTORE_VIEW permission', () => {
		before(async () => {
			app.use('/school/student/studentlernstorevisibility', new HandlePermissions('student', 'LERNSTORE_VIEW'));
			service = app.service('/school/student/studentlernstorevisibility');
			service.hooks(handlePermissionsHooks);
		});

		it('registered the service', () => {
			expect(service).to.not.be.null;
		});

		describe('patch', () => {
			it('throws Forbidden if FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED is false', async () => {
				Configuration.set('FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED', 'false');

				await expect(service.patch(null, {}, testParams)).to.be.rejectedWith(Forbidden);
			});

			it('changes the LERNSTORE_VIEW permission if FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED is true', async () => {
				Configuration.set('FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED', 'true');

				expect(testSchool.permissions.student).to.be.undefined;

				const data = { permission: { isEnabled: false } };
				const result = await service.patch(null, data, testParams);
				expect(result.permissions).to.deep.include({
					student: { LERNSTORE_VIEW: false },
				});
			});
		});
	});
});
