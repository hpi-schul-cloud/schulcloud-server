import { ObjectId } from '@mikro-orm/mongodb';
import { setupEntities, storageProviderFactory } from '@shared/testing';
import { FileOwnerModel } from '@modules/files/domain';
import { fileEntityFactory, filePermissionEntityFactory } from './testing';
import { FileEntity } from './file.entity';
import { FileSecurityCheckEntity } from './file-security-check.entity';

describe(FileEntity.name, () => {
	const storageProvider = storageProviderFactory.buildWithId();
	const mainUserId = new ObjectId().toHexString();
	const anotherUserId = new ObjectId().toHexString();
	const yetAnotherUserId = new ObjectId().toHexString();

	const copyFile = (file: FileEntity) =>
		new FileEntity({
			createdAt: file.createdAt,
			updatedAt: file.updatedAt,
			deletedAt: file.deletedAt,
			deleted: file.deleted,
			name: file.name,
			size: file.size,
			type: file.type,
			storageFileName: file.storageFileName,
			bucket: file.bucket,
			storageProvider: file.storageProvider,
			thumbnail: file.thumbnail,
			thumbnailRequestToken: file.thumbnailRequestToken,
			securityCheck: file.securityCheck,
			shareTokens: file.shareTokens,
			ownerId: file.ownerId,
			refOwnerModel: file.refOwnerModel,
			creatorId: file.creatorId,
			permissions: file.permissions,
			versionKey: file.versionKey,
		});

	beforeAll(async () => {
		await setupEntities();
	});

	describe('removePermissionsByRefId', () => {
		describe('when called on a file that contains some permission with given refId', () => {
			it('should properly remove this permission', () => {
				const anotherUsersPermissions = [
					filePermissionEntityFactory.build({ refId: anotherUserId }),
					filePermissionEntityFactory.build({ refId: yetAnotherUserId }),
				];
				const file = fileEntityFactory.build({
					ownerId: mainUserId,
					creatorId: mainUserId,
					permissions: [filePermissionEntityFactory.build({ refId: mainUserId }), ...anotherUsersPermissions],
				});

				const expectedFile = copyFile(file);
				expectedFile.permissions = anotherUsersPermissions;

				file.removePermissionsByRefId(mainUserId);

				expect(file).toEqual(expectedFile);
			});
		});

		describe("when called on a file that doesn't have any permission with given refId", () => {
			it('should not modify the file in any way (including the other present permissions)', () => {
				const file = fileEntityFactory.build({
					ownerId: mainUserId,
					creatorId: mainUserId,
					permissions: [
						filePermissionEntityFactory.build({ refId: mainUserId }),
						filePermissionEntityFactory.build({ refId: anotherUserId }),
					],
				});

				const originalFile = copyFile(file);

				const randomUserId = new ObjectId().toHexString();

				file.removePermissionsByRefId(randomUserId);

				expect(file).toEqual(originalFile);
			});
		});

		describe("when called on a file that doesn't have any permissions at all", () => {
			it('should not modify the file in any way', () => {
				const file = fileEntityFactory.build({ permissions: [] });

				const originalFile = copyFile(file);

				file.removePermissionsByRefId(mainUserId);

				expect(file).toEqual(originalFile);
			});
		});
	});

	describe('removCreatorId', () => {
		describe('when called on a file that contains matching creatorId', () => {
			const setup = () => {
				const file = fileEntityFactory.build({
					ownerId: mainUserId,
					creatorId: mainUserId,
				});

				const expectedFile = copyFile(file);
				expectedFile._creatorId = undefined;

				return { file, expectedFile };
			};
			it('should properly remove this creatorId', () => {
				const { file, expectedFile } = setup();

				file.removeCreatorId(mainUserId);

				expect(file).toEqual(expectedFile);
			});
		});

		describe("when called on a file that doesn't have any permission with given refId", () => {
			const setup = () => {
				const file = fileEntityFactory.build({
					ownerId: mainUserId,
					creatorId: mainUserId,
				});

				const originalFile = copyFile(file);

				const randomUserId = new ObjectId().toHexString();
				return { file, originalFile, randomUserId };
			};
			it('should not modify the file in any way (including the other present permissions)', () => {
				const { file, originalFile, randomUserId } = setup();

				file.removeCreatorId(randomUserId);

				expect(file).toEqual(originalFile);
			});
		});
	});

	describe('markForDeletion', () => {
		describe('when called on some typical file', () => {
			it('should properly mark the file for deletion', () => {
				const file = fileEntityFactory.build();

				const expectedFile = copyFile(file);

				const fakeCurrentDate = new Date('2023-01-01');

				expectedFile.deletedAt = fakeCurrentDate;
				expectedFile.deleted = true;

				jest.useFakeTimers().setSystemTime(fakeCurrentDate);

				file.markForDeletion();

				expect(file).toEqual(expectedFile);
			});
		});
	});

	describe('isMarkedForDeletion', () => {
		describe('when called on a file marked for deletion', () => {
			it('should return "true"', () => {
				const file = fileEntityFactory.build();

				file.markForDeletion();

				expect(file.isMarkedForDeletion()).toEqual(true);
			});
		});

		describe('when called on a file not marked for deletion (missing all the fields required for the proper marking)', () => {
			it('should return "false"', () => {
				const file = fileEntityFactory.build();

				expect(file.isMarkedForDeletion()).toEqual(false);
			});
		});

		describe('when called on a file not marked for deletion (missing "deleted" flag)', () => {
			it('should return "false"', () => {
				const file = fileEntityFactory.build();

				file.deleted = false;

				expect(file.isMarkedForDeletion()).toEqual(false);
			});
		});

		describe('when called on a file not marked for deletion (missing "deletedAt" timestamp)', () => {
			it('should return "false"', () => {
				const file = fileEntityFactory.build();

				file.deleted = true;

				expect(file.isMarkedForDeletion()).toEqual(false);
			});
		});

		describe('when called on a file not marked for deletion (invalid "deletedAt" timestamp)', () => {
			it('should return "false"', () => {
				const file = fileEntityFactory.build();

				file.deletedAt = new Date(0);

				expect(file.isMarkedForDeletion()).toEqual(false);
			});
		});
	});

	describe('constructor', () => {
		describe('when creating a directory', () => {
			it(`should return a valid ${FileEntity.name} object with fields values set from the provided complete props object`, () => {
				const userId = new ObjectId().toHexString();
				const props = {
					createdAt: new Date(2023, 8, 1),
					updatedAt: new Date(2023, 9, 1),
					deletedAt: new Date(2023, 10, 1),
					deleted: true,
					isDirectory: true,
					name: 'test-files',
					size: 1,
					type: 'dir',
					storageFileName: '000-test-files',
					bucket: '000-bucket',
					storageProvider: storageProviderFactory.buildWithId(),
					thumbnail: 'https://example.com/directory-thumbnail.png',
					thumbnailRequestToken: '9d96ca2e-bc14-4fde-9a8b-948cca0bd723',
					securityCheck: new FileSecurityCheckEntity({}),
					shareTokens: [
						'1c2ef176-cc1e-4e2e-bc64-0c84ad12ecb8',
						'27ede1ff-90c1-4423-8884-a1910dc383e0',
						'8786d3a3-7b66-431e-a19e-84a2a2f29f26',
					],
					parentId: new ObjectId().toHexString(),
					ownerId: userId,
					refOwnerModel: FileOwnerModel.USER,
					creatorId: userId,
					permissions: [filePermissionEntityFactory.build({ refId: userId })],
					lockId: new ObjectId().toHexString(),
					versionKey: 0,
				};

				const entity = new FileEntity(props);

				const entityProps = {
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
					deletedAt: entity.deletedAt,
					deleted: entity.deleted,
					isDirectory: entity.isDirectory,
					name: entity.name,
					size: entity.size,
					type: entity.type,
					storageFileName: entity.storageFileName,
					bucket: entity.bucket,
					storageProvider: entity.storageProvider,
					thumbnail: entity.thumbnail,
					thumbnailRequestToken: entity.thumbnailRequestToken,
					securityCheck: entity.securityCheck,
					shareTokens: entity.shareTokens,
					parentId: entity.parentId,
					ownerId: entity.ownerId,
					refOwnerModel: entity.refOwnerModel,
					creatorId: entity.creatorId,
					permissions: entity.permissions,
					lockId: entity.lockId,
					versionKey: entity.versionKey,
				};

				expect(entityProps).toEqual(props);
			});
		});

		describe('when creating a file (non-directory)', () => {
			const userId = new ObjectId().toHexString();

			it(`should create an object of the ${FileEntity.name} class`, () => {
				const file = fileEntityFactory.build();

				expect(file).toBeInstanceOf(FileEntity);
			});

			describe('when there is no bucket set in the provided props object', () => {
				it('should throw an exception', () => {
					const call = () =>
						new FileEntity({
							name: 'name',
							size: 42,
							storageFileName: 'name',
							storageProvider,
							ownerId: userId,
							refOwnerModel: FileOwnerModel.USER,
							creatorId: userId,
							permissions: [filePermissionEntityFactory.build({ refId: userId })],
						});
					expect(call).toThrow();
				});
			});

			describe('when there is no storageFileName set in the provided props object', () => {
				it('should throw an exception', () => {
					const call = () =>
						new FileEntity({
							name: 'name',
							size: 42,
							bucket: 'bucket',
							storageProvider,
							ownerId: userId,
							refOwnerModel: FileOwnerModel.USER,
							creatorId: userId,
							permissions: [filePermissionEntityFactory.build({ refId: userId })],
						});
					expect(call).toThrow();
				});
			});

			describe('when there is no storageProvider set in the provided props object', () => {
				it('should throw an exception', () => {
					const call = () =>
						new FileEntity({
							name: 'name',
							size: 42,
							bucket: 'bucket',
							storageFileName: 'name',
							ownerId: userId,
							refOwnerModel: FileOwnerModel.USER,
							creatorId: userId,
							permissions: [filePermissionEntityFactory.build({ refId: userId })],
						});
					expect(call).toThrow();
				});
			});
		});
	});
});
