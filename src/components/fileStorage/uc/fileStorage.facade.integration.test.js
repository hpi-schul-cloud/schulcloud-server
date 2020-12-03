const { expect } = require('chai');
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);

const { FileModel } = require('../repo/db');

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

			const result = await app.facade('/fileStorage/v2').deleteUserRelatedData(user._id);

			expect(result.complete).to.be.true;
			expect(result.trashBinData).to.be.an('array');
			result.trashBinData.forEach((data) => {
				expect(data).to.haveOwnProperty('scope');
				expect(data.data).to.be.an('object');
			});
		});

		it('when called with valid user id, then it deletes the users file permissions', async () => {
			const user = await testObjects.createTestUser();
			const file = await testObjects.createTestFile({ owner: user });

			await app.facade('/fileStorage/v2').deleteUserRelatedData(user._id);

			const result = await FileModel.findById(file._id).lean().exec();

			expect(result.permissions.some((permission) => permission.refId.toString() === user._id.toString())).to.be.false;
		});
	});
});
