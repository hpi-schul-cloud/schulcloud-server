const { Configuration } = require('@hpi-schul-cloud/commons');
const { expect } = require('chai');
const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;

const { facadeLocator } = require('../../../utils/facadeLocator');

const { removePermissionsThatUserCanAccess, removePersonalFiles } = require('./deleteUserData.uc').private;

const fileRepo = require('../repo/files.repo');
const fileStorageProviderRepo = require('../repo/fileStorageProvider.repo');
const { GeneralError } = require('../../../errors');

const facadeStubs = {
	'/users/v2': {
		getSchoolIdOfUser: sinon.stub().returns(Promise.resolve(new ObjectId())),
	},
	'/school/v2': {
		getStorageProviderIdForSchool: sinon.stub().returns(Promise.resolve(new ObjectId())),
	},
};

describe('deletedUserData.uc.unit', () => {
	const previousFacades = {};

	before(() => {
		for (const [key, facade] of Object.entries(facadeStubs)) {
			previousFacades[key] = facadeLocator.facade(key);
			facadeLocator.registerFacade(key, facade);
		}
	});

	after(() => {
		for (const [key, facade] of Object.entries(previousFacades)) {
			facadeLocator.registerFacade(key, facade);
		}
	});

	beforeEach(() => {
		sinon.stub(fileStorageProviderRepo, 'moveFilesToTrashBatch').returns(Promise.resolve(true));
	});

	afterEach(sinon.restore);

	describe('removePersonalFiles', () => {
		it('when the function is called with valid user id, then it returns with valid trash bin format', async () => {
			const userId = new ObjectId();
			const removePersonalFilesStub = sinon.stub(fileRepo, 'removePersonalFilesByUserId');
			removePersonalFilesStub.withArgs(userId).returns(true);
			sinon.stub(fileStorageProviderRepo, 'getStorageProviderMetaInformation').returns({ secretAccessKey: 'secret' });
			Configuration.set('S3_KEY', 'abcdefghijklmnop');
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
