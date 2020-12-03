const { expect } = require('chai');
const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;

const { removePermissionsThatUserCanAccess } = require('./applicationInternal/removePermissions');

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
			expect(result.complete).to.be.true;
			expect(result.trashBinData).to.be.an('array').that.is.not.empty;
			result.trashBinData.forEach((data) => {
				expect(data).to.haveOwnProperty('scope');
				expect(data.data).to.be.an('object');
			});
		});

		it('when an error is thrown, then the error is not caught', () => {
			const userId = new ObjectId();
			const getFilePermissionStub = sinon.stub(fileRepo, 'getFilePermissionsByUserId');
			getFilePermissionStub.withArgs(userId).throws(new GeneralError());
			expect(removePermissionsThatUserCanAccess(userId)).to.be.rejected;
		});
	});
});
