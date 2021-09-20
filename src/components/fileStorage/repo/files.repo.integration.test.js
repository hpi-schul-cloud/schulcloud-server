const { expect } = require('chai');
const { filesRepo } = require('.');

const {
	getFileOrDeletedFileById,
	getFilesWithUserPermissionsByUserId,
	removeFilePermissionsByUserId,
	getPersonalFilesByUserId,
	removePersonalFilesByUserId,
} = require('./files.repo');

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

	describe('getFileOrDeletedFileById', () => {
		describe('when a file is created and persisted', () => {
			let fileOwnerId;
			let file;

			beforeEach(async () => {
				fileOwnerId = generateObjectId();
				file = await fileTestUtils.create({ owner: fileOwnerId });
			});

			it('should read the file from persistence by valid id', async () => {
				const result = await getFileOrDeletedFileById(file._id);
				expect(result._id).to.eql(file._id);
				expect(result.owner).to.eql(fileOwnerId);
			});

			it('should resolve with null for invalid ids', async () => {
				const randomId = generateObjectId();
				// todo not found
				const result = await getFileOrDeletedFileById(randomId);
				expect(result).to.be.null;
			});
		});
	});

	describe('getPersonalFilesByUserId', () => {
		describe('when personal files are owned by the given user', () => {
			it('should return them', async () => {
				const fileOwnerId = generateObjectId();
				const [file1, file2] = await Promise.all([
					fileTestUtils.create({ owner: fileOwnerId }),
					fileTestUtils.create({ owner: fileOwnerId }),
				]);

				const result = await getPersonalFilesByUserId(fileOwnerId);

				expect(result).to.be.an('array').of.length(2);
				expect(result.map((file) => file._id.toString())).to.includes(file1._id.toString(), file2._id.toString());
			});
		});

		describe('when no personal files are owned by the given user', () => {
			it('should return an empty array', async () => {
				const userId = generateObjectId();
				const fileOwnerId = generateObjectId();
				await fileTestUtils.create({ owner: fileOwnerId });

				const result = await getPersonalFilesByUserId(userId);

				expect(result).to.be.an('array').of.length(0);
			});
		});

		describe('when the personal files of a user are deleted', () => {
			it('should not return them', async () => {
				const fileOwnerId = generateObjectId();
				await fileTestUtils.create({ owner: fileOwnerId, deletedAt: new Date() });

				const result = await getPersonalFilesByUserId(fileOwnerId);

				expect(result).to.be.an('array').of.length(0);
			});
		});
	});

	describe('removePersonalFilesByUserId', () => {
		describe('when no personal files are owned by the given user', () => {
			it('returns success and keeps all files', async () => {
				const userId = generateObjectId();
				const fileOwnerId = generateObjectId();
				const otherFile = await fileTestUtils.create({ owner: fileOwnerId });

				const success = await removePersonalFilesByUserId(userId);

				expect(success).to.be.true;
				const otherFileAfterDeletion = await getFileOrDeletedFileById(otherFile._id);
				expect(otherFileAfterDeletion).to.be.not.null;
			});
		});

		describe('when personal files are owned by the given user', () => {
			it('returns success and marks files owned by the given user for deletion', async () => {
				const fileOwnerId = generateObjectId();
				const [file1, file2] = await Promise.all([
					fileTestUtils.create({ owner: fileOwnerId }),
					fileTestUtils.create({ owner: fileOwnerId }),
				]);

				const success = await removePersonalFilesByUserId(fileOwnerId);

				expect(success).to.be.true;
				const [file1AfterDeletion, file2AfterDeletion] = await Promise.all([
					getFileOrDeletedFileById(file1._id),
					getFileOrDeletedFileById(file2._id),
				]);
				expect(file1AfterDeletion).to.have.property('deletedAt');
				expect(file2AfterDeletion).to.have.property('deletedAt');
			});
		});

		describe('when personal files owned by the given user are deleted', () => {
			it('return success and do not update the deletedAt flag', async () => {
				const deletedAt = new Date();
				const fileOwnerId = generateObjectId();
				const file = await fileTestUtils.create({ owner: fileOwnerId, deletedAt });

				const success = await removePersonalFilesByUserId(fileOwnerId);

				expect(success).to.be.true;
				const fileAfterDeletion = await getFileOrDeletedFileById(file._id);
				expect(fileAfterDeletion.deletedAt).to.deep.equal(deletedAt);
			});
		});
	});

	describe('getFilesWithUserPermissionsByUserId', () => {
		describe('when there is a file shared with the user', () => {
			it('returns the permuissions of this user for these files', async () => {
				const userId = generateObjectId();
				const fileOwnerId = generateObjectId();

				const userToBeDeletedPermission = fileTestUtils.createPermission({ refId: userId });
				const otherPermission = fileTestUtils.createPermission({ refId: fileOwnerId });
				const additonalPermissions = [userToBeDeletedPermission, otherPermission];
				await fileTestUtils.create({ owner: fileOwnerId, additonalPermissions });

				const result = await getFilesWithUserPermissionsByUserId(userId);
				expect(result).to.be.an('array').with.lengthOf(1);
				expect(result[0].permissions.every((permission) => permission.refId.toString() === userId.toString())).to.be
					.true;
			});
			it('returns only the files that are shared with the user', async () => {
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
			it('returns not deleted files', async () => {
				const userId = generateObjectId();
				const fileOwnerId = generateObjectId();

				const userToBeDeletedPermission = fileTestUtils.createPermission({ refId: userId });
				const additonalPermissions = [userToBeDeletedPermission];
				await fileTestUtils.create({ owner: fileOwnerId, additonalPermissions, deletedAt: new Date() });

				const result = await getFilesWithUserPermissionsByUserId(userId);
				expect(result).to.be.an('array').with.lengthOf(0);
			});
		});

		describe('when there is no file shared with the user', () => {
			it('returns an empty array', async () => {
				const userId = generateObjectId();
				const result = await getFilesWithUserPermissionsByUserId(userId);
				expect(result).to.be.an('array').that.is.empty;
			});
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

			const sharedFileCheck = await filesRepo.getFileById(sharedFile._id);
			expect(sharedFileCheck.permissions.some((permission) => permission.refId.toString() === userId.toString())).to.be
				.false;
		});
	});
});
