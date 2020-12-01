const { expect } = require('chai');
const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;

const { removePermissionsThatUserCanAccess } = require('./deleteUserData.uc');

const fileRepo = require('../repo/files.repo');
const { GeneralError } = require('../../../errors');

describe('deletedUserData.uc.unit', () => {
	describe('removePermissionsThatUserCanAccess', () => {
		let fileRepoStub;

		afterEach(() => {
			fileRepoStub.restore();
		});

		it('when the function is called with valid user id, then it returns with valid trash bin format', async () => {
			const userId = new ObjectId();
			fileRepoStub = sinon.stub(fileRepo, 'removeFilePermissionsByUserId');
			fileRepoStub.withArgs(userId).returns({
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
			});
			const result = await removePermissionsThatUserCanAccess(userId);
			expect(result.trashBinData).to.be.an('array').that.is.not.empty;
			result.trashBinData.forEach((data) => {
				expect(data).to.haveOwnProperty('scope');
				expect(data.data).to.be.an('object');
			});
		});

		it('when an error is thrown, then it returns empty array and success false', async () => {
			const userId = new ObjectId();
			fileRepoStub = sinon.stub(fileRepo, 'removeFilePermissionsByUserId');
			fileRepoStub.withArgs(userId).throws(new GeneralError());
			const result = await removePermissionsThatUserCanAccess(userId);
			expect(result.trashBinData).to.be.an('array').that.is.empty;
			expect(result.success).to.be.false;
		});
	});
});
