const { expect } = require('chai');
const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;

const { removePermissionsThatUserCanAccess } = require('./applicationInternal/removePermissionst');

const fileRepo = require('../repo/files.repo');
const { GeneralError } = require('../../../errors');

describe('deletedUserData.uc.unit', () => {
	describe('removePermissionsThatUserCanAccess', () => {
		afterEach(() => {
			sinon.restore();
		});

		it('when the function is called with valid user id, then it returns with valid trash bin format', async () => {
			const userId = new ObjectId();
			const removeFilePermissionStub = sinon.stub(fileRepo, 'removeFilePermissionsByUserId');
			removeFilePermissionStub.withArgs(userId).returns(true);
			const getFilePermissionStub = sinon.stub(fileRepo, 'getFilePermissionsByUserId');
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
			expect(result.trashBinData).to.be.an('array').that.is.not.empty;
			result.trashBinData.forEach((data) => {
				expect(data).to.haveOwnProperty('scope');
				expect(data.data).to.be.an('object');
			});
		});

		it.skip('when an error is thrown, then it returns empty array and success false', async () => {
			const userId = new ObjectId();
			const getFilePermissionStub = sinon.stub(fileRepo, 'getFilePermissionsByUserId');
			getFilePermissionStub.withArgs(userId).throws(new GeneralError());
			const result = await removePermissionsThatUserCanAccess(userId);
			expect(result.trashBinData).to.be.an('array').that.is.empty;
			expect(result.success).to.be.false;
		});
	});
});
