import { ObjectId } from '@mikro-orm/mongodb';
import { setupEntities, storageProviderFactory } from '@shared/testing';
import { FileOwnerModel, FilePermissionReferenceModel } from '@src/modules/files/domain';
import { userFileFactory } from './testing';
import { FileEntity } from './file.entity';
import { FilePermissionEntity } from './file-permission.entity';
import { FileSecurityCheckEntity } from './file-security-check.entity';

describe(FileEntity.name, () => {
	const storageProvider = storageProviderFactory.buildWithId();
	const mainUserId = new ObjectId().toHexString();
	const anotherUserId = new ObjectId().toHexString();
	const yetAnotherUserId = new ObjectId().toHexString();

	beforeAll(async () => {
		await setupEntities();
	});

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

	describe('removePermissionsByRefId', () => {
		it('should remove proper permission with given refId', () => {
			const anotherUsersPermissions = [
				new FilePermissionEntity({
					refId: anotherUserId,
					refPermModel: FilePermissionReferenceModel.USER,
				}),
				new FilePermissionEntity({
					refId: yetAnotherUserId,
					refPermModel: FilePermissionReferenceModel.USER,
				}),
			];
			const file = userFileFactory.build({
				ownerId: mainUserId,
				creatorId: mainUserId,
				permissions: [
					new FilePermissionEntity({
						refId: mainUserId,
						refPermModel: FilePermissionReferenceModel.USER,
					}),
					...anotherUsersPermissions,
				],
			});

			const expectedFile = copyFile(file);
			expectedFile.permissions = anotherUsersPermissions;

			file.removePermissionsByRefId(mainUserId);

			expect(file).toEqual(expectedFile);
		});

		describe('should not remove any permissions', () => {
			it('if there are none at all', () => {
				const file = userFileFactory.build({ permissions: [] });

				const originalFile = copyFile(file);

				file.removePermissionsByRefId(mainUserId);

				expect(file).toEqual(originalFile);
			});

			it('if none of them contains given refId', () => {
				const file = userFileFactory.build({
					ownerId: mainUserId,
					creatorId: mainUserId,
					permissions: [
						new FilePermissionEntity({
							refId: mainUserId,
							refPermModel: FilePermissionReferenceModel.USER,
						}),
						new FilePermissionEntity({
							refId: anotherUserId,
							refPermModel: FilePermissionReferenceModel.USER,
						}),
					],
				});

				const originalFile = copyFile(file);

				const randomUserId = new ObjectId().toHexString();

				file.removePermissionsByRefId(randomUserId);

				expect(file).toEqual(originalFile);
			});
		});
	});

	const setup = () => {
		const file = userFileFactory.build({
			ownerId: mainUserId,
			creatorId: mainUserId,
			permissions: [],
		});

		return { file };
	};

	describe('markForDeletion', () => {
		it('should properly mark the file for deletion', () => {
			const { file } = setup();

			const expectedFile = copyFile(file);

			const fakeCurrentDate = new Date('2023-01-01');

			expectedFile.deletedAt = fakeCurrentDate;
			expectedFile.deleted = true;

			jest.useFakeTimers().setSystemTime(fakeCurrentDate);

			file.markForDeletion();

			expect(file).toEqual(expectedFile);
		});
	});

	describe('isMarkedForDeletion', () => {
		it('should say the file is marked for deletion in case of a valid marking', () => {
			const { file } = setup();

			file.markForDeletion();

			expect(file.isMarkedForDeletion()).toEqual(true);
		});

		describe('should say the file is not marked for deletion', () => {
			it('in case of just some random file', () => {
				const { file } = setup();

				expect(file.isMarkedForDeletion()).toEqual(false);
			});

			it("in case of an invalid 'deleteAt' date", () => {
				const { file } = setup();

				file.deletedAt = new Date(0);

				expect(file.isMarkedForDeletion()).toEqual(false);
			});

			it("in case of the 'deleted' flag being false", () => {
				const { file } = setup();

				file.deleted = false;

				expect(file.isMarkedForDeletion()).toEqual(false);
			});

			it("in case of a deleted flag being set to 'true', but no deletedAt date being set", () => {
				const { file } = setup();

				file.deleted = true;

				expect(file.isMarkedForDeletion()).toEqual(false);
			});
		});
	});

	describe('constructor', () => {
		describe('when creating a directory', () => {
			it('should set proper fields values from the provided complete props object', () => {
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
					permissions: [
						new FilePermissionEntity({
							refId: userId,
							refPermModel: FilePermissionReferenceModel.USER,
						}),
					],
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

			it('should create file', () => {
				const file = userFileFactory.build();

				expect(file).toBeInstanceOf(FileEntity);
			});

			it('should throw without bucket', () => {
				const call = () =>
					new FileEntity({
						name: 'name',
						size: 42,
						storageFileName: 'name',
						storageProvider,
						ownerId: userId,
						refOwnerModel: FileOwnerModel.USER,
						creatorId: userId,
						permissions: [new FilePermissionEntity({ refId: userId, refPermModel: FilePermissionReferenceModel.USER })],
					});
				expect(call).toThrow();
			});

			it('should throw without storageFileName', () => {
				const call = () =>
					new FileEntity({
						name: 'name',
						size: 42,
						bucket: 'bucket',
						storageProvider,
						ownerId: userId,
						refOwnerModel: FileOwnerModel.USER,
						creatorId: userId,
						permissions: [new FilePermissionEntity({ refId: userId, refPermModel: FilePermissionReferenceModel.USER })],
					});
				expect(call).toThrow();
			});

			it('should throw without storageProvider', () => {
				const call = () =>
					new FileEntity({
						name: 'name',
						size: 42,
						bucket: 'bucket',
						storageFileName: 'name',
						ownerId: userId,
						refOwnerModel: FileOwnerModel.USER,
						creatorId: userId,
						permissions: [new FilePermissionEntity({ refId: userId, refPermModel: FilePermissionReferenceModel.USER })],
					});
				expect(call).toThrow();
			});
		});
	});
});
