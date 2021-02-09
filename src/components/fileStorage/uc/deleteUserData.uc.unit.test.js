const { expect } = require('chai');
const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;

const { removePermissionsThatUserCanAccess } = require('./applicationInternal/removePermissions');
const { removePersonalFiles } = require('./applicationInternal/removeFiles');

const fileRepo = require('../repo/files.repo');
const fileStrategy = require('../repo/strategies');
const { GeneralError } = require('../../../errors');

describe('deletedUserData.uc.unit', () => {
	afterEach(sinon.restore);

	describe('removePersonalFiles', () => {
		it('when the function is called with valid user id, then it returns with valid trash bin format', async () => {
			const userId = new ObjectId();
			const removePersonalFilesStub = sinon.stub(fileRepo, 'removePersonalFilesByUserId');
			removePersonalFilesStub.withArgs(userId).returns(true);
			const getPersonalFilesStub = sinon.stub(fileRepo, 'getPersonalFilesByUserId');
			getPersonalFilesStub.withArgs(userId).returns([
				{
					_id: 1,
					name: 'Dummy',
					isDirectory: false,
					owner: userId,
					creator: userId,
				},
			]);
			const createStrategyStub = sinon.stub(fileStrategy, 'createStrategy');
			createStrategyStub.withArgs('awsS3').returns({ moveFilesToTrash: () => true });

			const result = await removePersonalFiles(userId);

			expect(result.complete).to.be.true;
			expect(result.trashBinData).to.be.an('object');
			expect(result.trashBinData).to.haveOwnProperty('scope');
			expect(result.trashBinData).to.haveOwnProperty('data');
		});

		it('when the function is called with a user id from a user who has no personal files the result is empty', async () => {
			const userId = new ObjectId();
			const removePersonalFilesStub = sinon.stub(fileRepo, 'removePersonalFilesByUserId');
			removePersonalFilesStub.withArgs(userId).returns(true);
			const getPersonalFilesStub = sinon.stub(fileRepo, 'getPersonalFilesByUserId');
			getPersonalFilesStub.withArgs(userId).returns([]);
			const createStrategyStub = sinon.stub(fileStrategy, 'createStrategy');
			createStrategyStub.withArgs('awsS3').returns({ moveFilesToTrash: () => true });

			const result = await removePersonalFiles(userId);

			expect(result.complete).to.be.true;
			expect(result.trashBinData).to.be.an('object');
			expect(result.trashBinData).to.haveOwnProperty('scope');
			expect(result.trashBinData).to.haveOwnProperty('data');
		});
	});

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
});
