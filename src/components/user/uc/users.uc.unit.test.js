const { expect } = require('chai');
const { deleteUserUC, replaceUserWithTombstoneUC } = require('./users.uc');
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

	describe('user replace with tombstone orchestrator', () => {
		it('when the function is called, then it returns (replace with useful test)', async () => {
			const user = await testObjects.createTestUser();
			const result = await replaceUserWithTombstoneUC(user._id, app);
			expect(result).to.deep.equal({ success: true });
		});
	});

	describe('user delete orchestrator', () => {
		it('when the function is called, then it returns (replace with useful test)', async () => {
			// arrange
			const user = await testObjects.createTestUser();

			// act
			const result = await deleteUserUC(user._id, app);

			// assert
			expect(result).to.deep.equal({ success: true });
		});
	});
});
