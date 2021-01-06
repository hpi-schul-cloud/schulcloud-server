const { expect } = require('chai');
const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;

const { removePermissionsThatUserCanAccess } = require('./applicationInternal/removePermissions');

const fileRepo = require('../repo/files.repo');
const { GeneralError } = require('../../../errors');

describe('deletedUserData.uc.unit', () => {
	afterEach(sinon.restore);

	describe('removePermissionsThatUserCanAccess', () => {

		it('when the function is called with valid user id, then it returns with valid trash bin format', async () => {
			const userId = new ObjectId();
			const removeFilePermissionStub = sinon.stub(fileRepo, 'removeFilePermissionsByUserId');
			removeFilePermissionStub.withArgs(userId).returns(true);
			const getFilePermissionStub = sinon.stub(fileRepo, 'getFilesWithUserPermissionsByUserId');
			getFilePermissionStub.withArgs(userId).returns([
				{
					_id: 1,
					filePermissions: [
						{
							_id: new ObjectId(),
							permissions: [
								{
									refId: userId,
								},
							],
						},
					],
				},
			]);

			const result = await removePermissionsThatUserCanAccess(userId);

			expect(result.complete).to.be.true;
			expect(result.trashBinData).to.be.an('object');
			expect(result.trashBinData).to.haveOwnProperty('scope');
			expect(result.trashBinData).to.haveOwnProperty('data');
		});

		it('when the function is called with a user id, which is not connected with a file, the result is empty', async () => {
			const userId = new ObjectId();
			const removeFilePermissionStub = sinon.stub(fileRepo, 'removeFilePermissionsByUserId');
			removeFilePermissionStub.withArgs(userId).returns(true);
			const getFilePermissionStub = sinon.stub(fileRepo, 'getFilesWithUserPermissionsByUserId');
			getFilePermissionStub.withArgs(userId).returns([]);

			const result = await removePermissionsThatUserCanAccess(userId);

			expect(result.complete).to.be.true;
			expect(result.trashBinData).to.be.an('object');
			expect(result.trashBinData).to.haveOwnProperty('scope');
			expect(result.trashBinData).to.haveOwnProperty('data');
		});

		it('when an error is thrown, then the error is not caught', () => {
			const userId = new ObjectId();
			const getFilePermissionStub = sinon.stub(fileRepo, 'getFilesWithUserPermissionsByUserId');

			getFilePermissionStub.withArgs(userId).rejects(new GeneralError());

			expect(removePermissionsThatUserCanAccess(userId)).to.be.rejected;
		});
	});

	describe('removePersonalFiles', () => {
		it('when the function is called with valid user id, then it returns with valid trash bin format', async () => {
		});
		it('when the function is called with a user id, which is not connected with a file, the result is empty', async () => {
			const userId = new ObjectId();
			const removeFilePermissionStub = sinon.stub(fileRepo, 'removePersonalFilesByUserId');
			removeFilePermissionStub.withArgs(userId).returns(true);
			const getFilePermissionStub = sinon.stub(fileRepo, 'getPersonalFilesByUserId');
			getFilePermissionStub.withArgs(userId).returns([]);

			const result = await removePermissionsThatUserCanAccess(userId);

			expect(result.complete).to.be.true;
			expect(result.trashBinData).to.be.an('object');
			expect(result.trashBinData).to.haveOwnProperty('scope');
			expect(result.trashBinData).to.haveOwnProperty('data');
		});
	}
});
