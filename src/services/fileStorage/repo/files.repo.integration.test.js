const { expect } = require('chai');
const { FileModel } = require('../model');

const { findFilesThatUserCanAccess, deleteFilesByIDs } = require('./files.repo');

describe('user.repo.integration.test', function test() {
	let fileTestUtils;
	let server;
	let generateObjectId;
	let app;

	this.timeout(100000);

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

	// FileId do not exist
	// found no results
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

	// FileId do not exist
	// found no results
	it('delete files by IDs', async () => {
		const userId = generateObjectId();

		const toBeDeletedFile1 = await fileTestUtils.create({ owner: userId });
		const toBeDeletedFile2 = await fileTestUtils.create({ owner: userId });
		const fileToNOTBeDeleted = await fileTestUtils.create({ owner: userId });

		const toBeDeltedFileIds = [toBeDeletedFile1._id, toBeDeletedFile2._id];
		const batchTaskResult = await deleteFilesByIDs(toBeDeltedFileIds);
		expect(batchTaskResult).to.eql({ n: 2, ok: 1, deletedCount: 2 });

		const searchDBResult = await FileModel.find({ _id: {$in: [...toBeDeltedFileIds, fileToNOTBeDeleted._id] } });

		const findFileIds = searchDBResult.map(({ _id }) => _id.toString());
		expect(findFileIds, 'should include the not deleted file').to.be.an('array').with.lengthOf(1);
		expect(findFileIds).to.include(fileToNOTBeDeleted._id.toString());
	});

	describe('delete permission connections for user that should be deleted', () => {
		it('if the file is shared with the user to be deleted', async () => {
			const userToBeDeletedId = generateObjectId();
			const fileOwnerId = generateObjectId();

			const userToBeDeletedPermission = fileTestUtils.createPermission({ refId: userToBeDeletedId });
			const additonalPermissions = [userToBeDeletedPermission];
			const sharedFile = await fileTestUtils.create({ owner: fileOwnerId, additonalPermissions });
			expect(sharedFile.permissions.some((permission) => permission.refId.equals(userToBeDeletedId))).to.be.true;
			// call function to delete permission
			const sharedFileFromDB = await FileModel.get(sharedFile._id);
			expect(sharedFileFromDB.permissions.some((permission) => permission.refId.equals(userToBeDeletedId))).to.be.false;
		});
	});
});
