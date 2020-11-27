const { expect } = require('chai');
const { FileModel } = require('./db');

const {
	findFilesThatUserCanAccess,
	deleteFilesByIDs,
	removeFilePermissionsByUserId,
	findPersonalFiles,
} = require('./files.repo');

describe.only('files.repo.integration.test', () => {
	let fileTestUtils;
	let server;
	let generateObjectId;
	let app;

	const findFiles = (fileIds = []) =>
		FileModel.find({ _id: { $in: fileIds } })
			.lean()
			.exec();

	before(async () => {
		/* eslint-disable global-require */
		app = await require('../../../app');
		({ files: fileTestUtils, generateObjectId } = require('../../../../test/services/helpers/testObjects')(app));
		/* eslint-enable global-require */
		server = await app.listen(0);
	});

	after(async () => {
		await fileTestUtils.cleanup();
		await server.close();
	});

	describe.skip('findPersonalFiles', () => {
		it('does not find files from other users', async () => {
			const userToBeDeletedId = generateObjectId();
			const fileOwnerId = generateObjectId();

			await fileTestUtils.create({ owner: fileOwnerId });

			const result = await findPersonalFiles(userToBeDeletedId);
			expect(result, 'should return emptry array').to.be.an('array').with.lengthOf(0);
		});

		it('find personal files', async () => {
			const userToBeDeletedId = generateObjectId();
			const fileOwnerId = generateObjectId();

			const ownedByUserToBeDeleted = await fileTestUtils.create({ owner: userToBeDeletedId });
			await fileTestUtils.create({ owner: fileOwnerId });

			const result = await findPersonalFiles(userToBeDeletedId);
			expect(result).to.be.an('array').with.lengthOf(1);
			expect(result[0]._id.toString()).to.equal(ownedByUserToBeDeleted._id.toString());
		});

		it('work for select', async () => {
			const owner = generateObjectId();

			await fileTestUtils.create({ owner });

			const selectedKeys = ['_id', 'creator', 'owner'];
			const result = await findPersonalFiles(owner, selectedKeys);
			expect(result).to.be.an('array').with.lengthOf(1);
			expect(result[0]).to.have.all.keys(selectedKeys);
		});
	});

	describe.skip('findFilesThatUserCanAccess', () => {
		it('no result', async () => {
			const userToBeDeletedId = generateObjectId();
			const fileOwnerId = generateObjectId();

			await fileTestUtils.create({ owner: fileOwnerId });

			const result = await findFilesThatUserCanAccess(userToBeDeletedId);
			expect(result, 'should return emptry array').to.be.an('array').with.lengthOf(0);
		});

		it('files created by the user should not be found', async () => {
			const userToBeDeletedId = generateObjectId();
			const fileOwnerId = userToBeDeletedId;

			await fileTestUtils.create({ owner: fileOwnerId });

			const result = await findFilesThatUserCanAccess(userToBeDeletedId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('find files shared with the user that should be deleted', async () => {
			const userToBeDeletedId = generateObjectId();
			const fileOwnerId = generateObjectId();

			const userToBeDeletedPermission = fileTestUtils.createPermission({ refId: userToBeDeletedId });
			const additonalPermissions = [userToBeDeletedPermission];
			const fileToBeFound = await fileTestUtils.create({ owner: fileOwnerId, additonalPermissions });
			const fileNOTToBeFound = await fileTestUtils.create({ owner: fileOwnerId });
			const fileWhereUserToBeDeletedIsOwner = await fileTestUtils.create({ owner: userToBeDeletedId });

			const result = await findFilesThatUserCanAccess(userToBeDeletedId);
			expect(result, 'should not return an error').to.be.an('array').with.lengthOf(1);
			const findFileIds = result.map(({ _id }) => _id.toString());
			expect(findFileIds).to.include(fileToBeFound._id.toString());
			expect(findFileIds).to.not.include(fileWhereUserToBeDeletedIsOwner._id.toString());
			expect(findFileIds).to.not.include(fileNOTToBeFound._id.toString());
		});
	});

	describe.skip('deleteFilesByIDs', () => {
		it('note error in batch result if file not exist', async () => {
			const userId = generateObjectId();

			const toBeDeletedFile1 = await fileTestUtils.create({ owner: userId });
			const toBeDeltedFileIds = [toBeDeletedFile1._id, generateObjectId()];
			const result = await deleteFilesByIDs(toBeDeltedFileIds);
			expect(result.success).to.be.false;
		});

		it('delete files by IDs', async () => {
			const userId = generateObjectId();

			const toBeDeletedFile1 = await fileTestUtils.create({ owner: userId });
			const toBeDeletedFile2 = await fileTestUtils.create({ owner: userId });
			const fileToNOTBeDeleted = await fileTestUtils.create({ owner: userId });

			const toBeDeltedFileIds = [toBeDeletedFile1._id, toBeDeletedFile2._id];
			const result = await deleteFilesByIDs(toBeDeltedFileIds);
			expect(result.fileIds).to.eql(toBeDeltedFileIds);
			expect(result.success).to.be.true;

			const searchDBResult = await findFiles([...toBeDeltedFileIds, fileToNOTBeDeleted._id]);

			const findFileIds = searchDBResult.map(({ _id }) => _id.toString());
			expect(findFileIds, 'should include the not deleted file').to.be.an('array').with.lengthOf(1);
			expect(findFileIds).to.include(fileToNOTBeDeleted._id.toString());
		});
	});

	describe('removeFilePermissionsByUserId', () => {
		it('when there is a file shared with the user then his permissions are removed', async () => {
			const userId = generateObjectId();
			const fileOwnerId = generateObjectId();

			const userToBeDeletedPermission = fileTestUtils.createPermission({ refId: userId });
			const additonalPermissions = [userToBeDeletedPermission];
			const sharedFile = await fileTestUtils.create({ owner: fileOwnerId, additonalPermissions });

			const resultStatus = await removeFilePermissionsByUserId(userId);

			expect(resultStatus.success).to.be.true;
			expect(resultStatus.filePermissions).to.be.an('array').with.lengthOf(1);

			const sharedFileCheck = await FileModel.findById(sharedFile._id);
			expect(sharedFileCheck.permissions.some((permission) => permission.refId.toString() === userId.toString())).to.be.false;
		});

		it('when there is a file shared with the user, only the users permissions are returned', async () => {
			const userId = generateObjectId();
			const fileOwnerId = generateObjectId();

			const userToBeDeletedPermission = fileTestUtils.createPermission({ refId: userId });
			const additonalPermissions = [userToBeDeletedPermission];
			await fileTestUtils.create({ owner: fileOwnerId, additonalPermissions });

			const resultStatus = await removeFilePermissionsByUserId(userId);
			expect(resultStatus.filePermissions).to.be.an('array').with.lengthOf(1);
			expect(
				resultStatus.filePermissions[0].permissions.every(
					(permission) => permission.refId.toString() === userId.toString()
				)
			).to.be.true;
		});

		it('when there is a filed owned by the user then his permmissions are also removed');

		it('when called, then the response contains only files shared with the user');
	});
});
