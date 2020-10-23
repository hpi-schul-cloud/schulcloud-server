const assert = require('assert');
const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

describe('edusharing hooks', () => {
	let server;
	let eduSharingService;

	before((done) => {
		eduSharingService = app.service('edu-sharing');
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	it('registered the service', async () => {
		assert.ok(eduSharingService);
	});

	it('get restrict Lern-Store access to students from SH', async () => {
		try {
			const studentSH = await testObjects.createTestUser({ roles: ['student', 'studentSH'] });
			const paramsStudentSH = await testObjects.generateRequestParamsFromUser(studentSH);
			await eduSharingService.get('dummy', paramsStudentSH);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have permission to access this resource.");
		}
	});

	it('find restrict Lern-Store access to students from SH', async () => {
		try {
			const studentSH = await testObjects.createTestUser({ roles: ['student', 'studentSH'] });
			const paramsStudentSH = await testObjects.generateRequestParamsFromUser(studentSH);
			paramsStudentSH.query = { query: { searchQuery: 'foo' } };
			await eduSharingService.find(paramsStudentSH);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have permission to access this resource.");
		}
	});
});
