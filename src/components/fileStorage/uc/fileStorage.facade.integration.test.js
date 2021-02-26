const { expect } = require('chai');
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);

const { filesRepo } = require('../repo');

describe('fileStorageFacade', () => {
	let server;
	let app;

	before(async () => {
		app = await appPromise;
		server = await app.listen();
	});

	after(async () => {
		testObjects.cleanup;
		await server.close();
	});

	describe('deleteUserRelatedData', () => {
		it('when called with valid user id, then it returns trash bin data', async () => {
			const user = await testObjects.createTestUser();
			await testObjects.createTestFile({ owner: user });

			const deleteFunctions = app.facade('/fileStorage/v2').deleteUserData;
			expect(deleteFunctions).to.be.an('array').that.is.not.empty;
			for (const deleteFunction of deleteFunctions.slice(0, 1)) {
				// eslint-disable-next-line no-await-in-loop
				const result = await deleteFunction(user._id);
				expect(result.complete).to.be.true;
				expect(result.trashBinData).to.be.an('object');
				expect(result.trashBinData).to.haveOwnProperty('scope');
				expect(result.trashBinData).to.haveOwnProperty('data');
			}
		});

		it('when called with valid user id, then it deletes the users file permissions', async () => {
			const user = await testObjects.createTestUser();
			const file = await testObjects.createTestFile({ owner: user });

			const deleteFunctions = app.facade('/fileStorage/v2').deleteUserData;
			expect(deleteFunctions).to.be.an('array').that.is.not.empty;
			for (const deleteFunction of deleteFunctions.slice(0, 1)) {
				// eslint-disable-next-line no-await-in-loop
				await deleteFunction(user._id);
			}

			const result = await filesRepo.getFileById(file._id);

			expect(result.permissions.some((permission) => permission.refId.toString() === user._id.toString())).to.be.false;
		});
	});
});
