const { expect } = require('chai');
const { FileModel } = require('./db');

const { getFileById, getFilesWithUserPermissionsByUserId, removeFilePermissionsByUserId } = require('./files.repo');

describe('files.repo.integration.test', () => {
	let fileTestUtils;
	let server;
	let generateObjectId;
	let app;

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

	describe('getFileById', () => {
		it('when file with given id exists the file gets returned', async () => {
			const fileOwnerId = generateObjectId();
			const file = await fileTestUtils.create({ owner: fileOwnerId });

			const result = await getFileById(file._id);

			expect(result._id).to.eql(file._id);
			expect(result.owner).to.eql(fileOwnerId);
		});

		it('when file with given id does not exist null gets returned', async () => {
			const randomId = generateObjectId();

			const result = await getFileById(randomId);

			expect(result).to.be.null;
		});
	});

	describe('getFilesWithUserPermissionsByUserId', () => {
		it('when there is a file shared with the user, only the users permissions are returned', async () => {
			const userId = generateObjectId();
			const fileOwnerId = generateObjectId();

			const userToBeDeletedPermission = fileTestUtils.createPermission({ refId: userId });
			const otherPermission = fileTestUtils.createPermission({ refId: fileOwnerId });
			const additonalPermissions = [userToBeDeletedPermission, otherPermission];
			await fileTestUtils.create({ owner: fileOwnerId, additonalPermissions });

			const result = await getFilesWithUserPermissionsByUserId(userId);
			expect(result).to.be.an('array').with.lengthOf(1);
			expect(result[0].permissions.every((permission) => permission.refId.toString() === userId.toString())).to.be.true;
		});

		it('when called, then the response contains only files shared with the user', async () => {
			const userId = generateObjectId();
			const fileOwnerId = generateObjectId();

			const userToBeDeletedPermission = fileTestUtils.createPermission({ refId: userId });
			const additonalPermissions = [userToBeDeletedPermission];
			const fileToBeFound = await fileTestUtils.create({ owner: fileOwnerId, additonalPermissions });
			await fileTestUtils.create({ owner: fileOwnerId });

			const result = await getFilesWithUserPermissionsByUserId(userId);
			expect(result).to.be.an('array').with.lengthOf(1);
			expect(result[0]._id).to.eql(fileToBeFound._id);
		});

		it('when there is no file shared with the user, the result is empty', async () => {
			const userId = generateObjectId();
			const result = await getFilesWithUserPermissionsByUserId(userId);
			expect(result).to.be.an('array').that.is.empty;
		});
	});

	describe('removeFilePermissionsByUserId', () => {
		it('when there is a file shared with the user then his permissions are removed', async () => {
			const userId = generateObjectId();
			const fileOwnerId = generateObjectId();

			const userToBeDeletedPermission = fileTestUtils.createPermission({ refId: userId });
			const additonalPermissions = [userToBeDeletedPermission];
			const sharedFile = await fileTestUtils.create({ owner: fileOwnerId, additonalPermissions });

			const result = await removeFilePermissionsByUserId(userId);
			expect(result).to.be.true;

			const sharedFileCheck = await FileModel.findById(sharedFile._id).lean().exec();
			expect(sharedFileCheck.permissions.some((permission) => permission.refId.toString() === userId.toString())).to.be
				.false;
		});
	});
});
