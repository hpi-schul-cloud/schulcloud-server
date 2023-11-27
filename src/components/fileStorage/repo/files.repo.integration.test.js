const { expect } = require('chai');
const { filesRepo } = require('.');

const { FileModel } = require('./db');

const { NotFound } = require('../../../errors');

const {
	getFileById,
	getFilesWithUserPermissionsByUserId,
	removeFilePermissionsByUserId,
	getPersonalFilesByUserId,
	removePersonalFilesByUserId,
	removeFileById,
} = require('./files.repo');

const getFileOrDeletedFileById = async (id) => FileModel.findOneWithDeleted({ _id: id });

describe('files.repo.integration.test', () => {
	let fileTestUtils;
	let server;
	let generateObjectId;
	let app;

	before(async () => {
		/* eslint-disable global-require */
		app = await require('../../../app')();
		({ files: fileTestUtils, generateObjectId } = require('../../../../test/services/helpers/testObjects')(app));
		/* eslint-enable global-require */
		server = await app.listen(0);
	});

	after(async () => {
		await fileTestUtils.cleanup();
		await server.close();
	});

	describe('getFileById', () => {
		describe('when a file is created and persisted', () => {
			let fileOwnerId;
			let file;

			beforeEach(async () => {
				fileOwnerId = generateObjectId();
				file = await fileTestUtils.create({ owner: fileOwnerId });
			});

			it('should read the file from persistence by valid id', async () => {
				const result = await getFileById(file._id);
				expect(result._id).to.eql(file._id);
				expect(result.owner).to.eql(fileOwnerId);
			});

			it('should throw NotFound for invalid ids', async () => {
				const randomId = generateObjectId();
				await expect(getFileById(randomId)).to.be.rejectedWith(NotFound);
			});
		});
	});

	describe('removeFileById', () => {
		describe('when given a regular file', () => {
			it('should mark the given file for deletion', async () => {
				const fileOwnerId = generateObjectId();
				const file = await fileTestUtils.create({ owner: fileOwnerId });
				const fileBeforeDeletion = await FileModel.findOneWithDeleted({ _id: file._id });
				expect(fileBeforeDeletion.deleted).to.be.false;
				expect(fileBeforeDeletion.deletedAt).to.be.undefined;

				await removeFileById(file._id);

				const fileAfterDeletion = await FileModel.findOneWithDeleted({ _id: file._id });
				expect(fileAfterDeletion.deleted).to.be.true;
				expect(fileAfterDeletion).to.have.property('deletedAt');
				const expectedTimeDifferenceInSeconds = 5;
				expect(new Date().getTime() - fileAfterDeletion.deletedAt.getTime()).to.be.lessThan(
					expectedTimeDifferenceInSeconds * 1000,
					`The time difference between the deletedAt date and now should be less than ${expectedTimeDifferenceInSeconds}s`
				);
			});

			it('should prevent deleted files to be found via regular search queries', async () => {
				const fileOwnerId = generateObjectId();
				const file = await fileTestUtils.create({ owner: fileOwnerId });

				await removeFileById(file._id);

				const fileAfterDeletion = await FileModel.findOne({ _id: file._id });
				expect(fileAfterDeletion).to.be.null;
			});
		});

		describe('when given a directory', () => {
			it('should also remove the content of the given directory', async () => {
				const fileOwnerId = generateObjectId();
				const directory = await fileTestUtils.create({ owner: fileOwnerId, isDirectory: true });
				const files = await Promise.all([
					fileTestUtils.create({ owner: fileOwnerId, parent: directory._id }),
					fileTestUtils.create({ owner: fileOwnerId, parent: directory._id }),
					fileTestUtils.create({ owner: fileOwnerId, parent: directory._id }),
				]);
				for (const file of files) {
					// eslint-disable-next-line no-await-in-loop
					const fileBeforeDeletion = await FileModel.findOneWithDeleted({ _id: file._id });
					expect(fileBeforeDeletion.deleted).to.be.false;
				}
				const directoryBeforeDeletion = await FileModel.findOneWithDeleted({ _id: directory._id });
				expect(directoryBeforeDeletion.deleted).to.be.false;

				await removeFileById(directory._id);

				for (const file of files) {
					// eslint-disable-next-line no-await-in-loop
					const fileAfterDeletion = await FileModel.findOneWithDeleted({ _id: file._id });
					expect(fileAfterDeletion.deleted).to.be.true;
				}
				const directoryAfterDeletion = await FileModel.findOneWithDeleted({ _id: directory._id });
				expect(directoryAfterDeletion.deleted).to.be.true;
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
				const otherFileAfterDeletion = await getFileById(otherFile._id);
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
