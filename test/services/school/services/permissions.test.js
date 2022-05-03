const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects');
const { Forbidden } = require('../../../../src/errors');

describe('permissons service', () => {
	let app;
	let server;
	let service;
	let testHelper;

	before(async () => {
		app = await appPromise;
		testHelper = testObjects(appPromise);
		server = await app.listen(0);
		service = app.service('/school/teacher/studentvisibility');
	});

	after(async () => {
		await testHelper.cleanup();
		await server.close();
	});

	it('registered the permissions services', () => {
		expect(service).to.not.be.null;
	});

	describe('patch', () => {
		it('throws Forbidden if TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE is false', async () => {
			Configuration.set('TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE', 'false');
			const admin = await testHelper.createTestUser({ roles: ['administrator'] });
			const params = await testHelper.generateRequestParamsFromUser(admin);
			params.query = {};
			await expect(service.patch(null, {}, params)).to.be.rejectedWith(Forbidden);
		});

		it('changes the STUDENT_LIST permission if TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE is true ', async () => {
			Configuration.set('TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE', 'true');

			const school = await testHelper.createTestSchool();
			expect(school.permissions.teacher.STUDENT_LIST).to.be.true;

			const admin = await testHelper.createTestUser({ schoolId: school._id, roles: ['administrator'] });
			const params = await testHelper.generateRequestParamsFromUser(admin);
			params.query = {};
			const data = { permission: { isEnabled: false } };
			await expect(service.patch(null, data, params)).to.eventually.deep.include({
				permissions: { teacher: { STUDENT_LIST: false } },
			});
		});
	});
});
