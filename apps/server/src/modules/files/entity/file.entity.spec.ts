import { ObjectId } from '@mikro-orm/mongodb';

import { setupEntities, storageProviderFactory } from '@shared/testing';
import { FileOwnerModel, FilePermissionReferenceModel } from '@src/modules/files/domain';

import { userFileFactory } from './testing';
import { FileEntity } from './file.entity';
import { FilePermissionEntity } from './file-permission.entity';

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
