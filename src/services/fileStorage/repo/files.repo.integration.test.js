const { expect } = require('chai');
const { FileModel } = require('../model');

const { findFilesShardWithUserId, deleteFilesByIDs } = require('./files.repo');

describe('user.repo.integration.test', () => {
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

	it('findFilesShardWithUserId', async () => {
		const userToBeDeleted = generateObjectId();
		const fileOwner = generateObjectId();

		const userToBeDeletedPermission = fileTestUtils.createPermission({ refId: userToBeDeleted });
		const additonalPermissions = [userToBeDeletedPermission];
		const fileToBeFound = await fileTestUtils.create({ owner: fileOwner, additonalPermissions });
		const fileNOTToBeFound = await fileTestUtils.create({ owner: fileOwner });
		const fileWhereUserToBeDeletedIsOwner = await fileTestUtils.create({ owner: userToBeDeleted });

		const result = await findFilesShardWithUserId(userToBeDeleted);
	});
});
