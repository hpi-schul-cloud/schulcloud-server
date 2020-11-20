const { expect } = require('chai');
const { FileModel } = require('../model');

const {
	findFilesThatUserCanAccess,
	deleteFilesByIDs,
	removeFilePermissionsByUserId,
	findPersonalFiles,
} = require('./files.repo');

describe('user.repo.integration.test', () => {
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

	describe('findPersonalFiles', () => {
		it('no result', async () => {
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
			expect(result, 'should return emptry array').to.be.an('array').with.lengthOf(1);
			expect(result[0]._id.toString()).to.include(ownedByUserToBeDeleted._id.toString());
		});
	});

	describe('findFilesThatUserCanAccess', () => {
		it('no result', async () => {
			const userToBeDeletedId = generateObjectId();
			const fileOwnerId = generateObjectId();

			await fileTestUtils.create({ owner: fileOwnerId });

			const result = await findFilesThatUserCanAccess(userToBeDeletedId);
			expect(result, 'should return emptry array').to.be.an('array').with.lengthOf(0);
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
			expect(result, 'should not return an error').to.be.an('array').with.lengthOf(2);
			const findFileIds = result.map(({ _id }) => _id.toString());
			expect(findFileIds).to.include(fileToBeFound._id.toString());
			expect(findFileIds).to.include(fileWhereUserToBeDeletedIsOwner._id.toString());
			expect(findFileIds).to.not.include(fileNOTToBeFound._id.toString());
		});
	});

	describe('deleteFilesByIDs', () => {
		it('note error in batch result if file not exist', async () => {
			const userId = generateObjectId();

			const toBeDeletedFile1 = await fileTestUtils.create({ owner: userId });
			const toBeDeltedFileIds = [toBeDeletedFile1._id, generateObjectId()];
			const batchTaskResult = await deleteFilesByIDs(toBeDeltedFileIds);
			expect(batchTaskResult).to.eql({ n: 1, ok: 0, deletedCount: 1 });
		});

		it('delete files by IDs', async () => {
			const userId = generateObjectId();

			const toBeDeletedFile1 = await fileTestUtils.create({ owner: userId });
			const toBeDeletedFile2 = await fileTestUtils.create({ owner: userId });
			const fileToNOTBeDeleted = await fileTestUtils.create({ owner: userId });

			const toBeDeltedFileIds = [toBeDeletedFile1._id, toBeDeletedFile2._id];
			const batchTaskResult = await deleteFilesByIDs(toBeDeltedFileIds);
			expect(batchTaskResult).to.eql({ n: 2, ok: 1, deletedCount: 2 });

			const searchDBResult = await findFiles([...toBeDeltedFileIds, fileToNOTBeDeleted._id]);

			const findFileIds = searchDBResult.map(({ _id }) => _id.toString());
			expect(findFileIds, 'should include the not deleted file').to.be.an('array').with.lengthOf(1);
			expect(findFileIds).to.include(fileToNOTBeDeleted._id.toString());
		});
	});

	describe('delete permission connections for user that should be deleted', () => {
		const hasUserPermissions = (userId) => (permission) => permission.refId.equals(userId);

		it('note error in batch result if file not exist', async () => {
			const userId = generateObjectId();

			const sharedFile = await fileTestUtils.create({ owner: userId });
			const fileIds = [sharedFile._id, generateObjectId()];
			const batchTaskResult = await removeFilePermissionsByUserId(fileIds, userId);
			expect(batchTaskResult).to.eql({ n: 1, ok: 0, nModified: 1 });
		});

		it('if the file is shared with the user to be deleted', async () => {
			const userToBeDeletedId = generateObjectId();
			const fileOwnerId = generateObjectId();

			const isOwner = await fileTestUtils.create({ owner: userToBeDeletedId });

			const userToBeDeletedPermission = fileTestUtils.createPermission({ refId: userToBeDeletedId });
			const additonalPermissions = [userToBeDeletedPermission];
			const sharedFile = await fileTestUtils.create({ owner: fileOwnerId, additonalPermissions });

			// twice
			additonalPermissions.push(userToBeDeletedPermission);
			const sharedFileWithDoubleAddedPermissions = await fileTestUtils.create({
				owner: fileOwnerId,
				additonalPermissions,
			});

			const fileIds = [isOwner._id, sharedFile._id, sharedFileWithDoubleAddedPermissions._id];
			const resultStatus = await removeFilePermissionsByUserId(fileIds, userToBeDeletedId);

			expect(resultStatus).to.eql({ n: 3, ok: 1, nModified: 3 });

			const result = await findFiles(fileIds);

			const test = hasUserPermissions(userToBeDeletedId);
			expect(result[0].permissions.some(test), 'first element').to.be.false;
			expect(result[1].permissions.some(test), 'second element').to.be.false;
			expect(result[2].permissions.some(test), 'third element').to.be.false;
		});
	});
});
