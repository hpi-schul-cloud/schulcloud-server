import { expect } from 'chai';
import sinon from 'sinon';
import mongooseImport from 'mongoose'; 
const { ObjectId } = mongooseImport.Types;

import { removePermissionsThatUserCanAccess } from './applicationInternal/removePermissions';

import fileRepo from '../repo/files.repo';
import { GeneralError } from '../../../errors';

describe('deletedUserData.uc.unit', () => {
	describe('removePermissionsThatUserCanAccess', () => {
		afterEach(sinon.restore);

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
});
