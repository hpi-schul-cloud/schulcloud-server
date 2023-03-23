const assert = require('assert');
const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise());
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');

describe('edusharing hooks', () => {
	let app;
	let eduSharingService;
	let nestServices;
	let server;

	before(async () => {
		app = await appPromise();
		eduSharingService = app.service('edu-sharing');
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	it('registered the service', async () => {
		assert.ok(eduSharingService);
	});

	it('get restrict Lern-Store access to students', async () => {
		try {
			const school = await testObjects.createTestSchool({
				permissions: { student: { LERNSTORE_VIEW: false } },
			});
			const student = await testObjects.createTestUser({ schoolId: school._id, roles: ['student'] });
			const paramsStudent = await testObjects.generateRequestParamsFromUser(student);
			await eduSharingService.get('dummy', paramsStudent);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have one of the permissions: LERNSTORE_VIEW.");
		}
	});

	it('find restrict Lern-Store access to students', async () => {
		try {
			const school = await testObjects.createTestSchool({
				permissions: { student: { LERNSTORE_VIEW: false } },
			});
			const student = await testObjects.createTestUser({ schoolId: school._id, roles: ['student'] });
			const paramsStudent = await testObjects.generateRequestParamsFromUser(student);
			paramsStudent.query = { query: { searchQuery: 'foo' } };
			await eduSharingService.find(paramsStudent);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have one of the permissions: LERNSTORE_VIEW.");
		}
	});
});
