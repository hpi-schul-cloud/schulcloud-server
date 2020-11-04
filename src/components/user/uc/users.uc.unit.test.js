const { expect } = require('chai');
const {
	deleteUser,
	// replaceUserWithTombstone
} = require('./users.uc');
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);

describe('users usecase', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
	});

	// describe('user replace with tombstone orchestrator', () => {
	// 	it('when the function is called, then it returns (replace with useful test)', async () => {
	// 		const { _id: schoolId } = await testObjects.createTestSchool();
	// 		const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
	// 		const result = await replaceUserWithTombstone(user._id, app);
	// 		expect(result).to.deep.equal({ success: true });
	// 	});
	// });
	describe('user delete orchestrator', () => {
		it('when the function is called, then it returns (replace with useful test)', async () => {
			// arrange
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['student'], schoolId });

			// act
			const result = await deleteUser(user._id, app);

			// assert
			expect(result).to.deep.equal({ success: true });
		});
	});
});
