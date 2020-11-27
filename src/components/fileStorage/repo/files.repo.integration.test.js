const { expect } = require('chai');
const { FileModel } = require('./db');

const { removeFilePermissionsByUserId } = require('./files.repo');

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

			const sharedFileCheck = await FileModel.findById(sharedFile._id).lean().exec();
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

		it('when called, then the response contains only files shared with the user', async () => {
			const userId = generateObjectId();
			const fileOwnerId = generateObjectId();

			const userToBeDeletedPermission = fileTestUtils.createPermission({ refId: userId });
			const additonalPermissions = [userToBeDeletedPermission];
			await fileTestUtils.create({ owner: fileOwnerId, additonalPermissions });
			await fileTestUtils.create({ owner: fileOwnerId });

			const resultStatus = await removeFilePermissionsByUserId(userId);
			expect(resultStatus.filePermissions).to.be.an('array').with.lengthOf(1);
		});
	});
});
