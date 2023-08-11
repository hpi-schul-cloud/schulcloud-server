import { ObjectId } from '@mikro-orm/mongodb';

import { setupEntities, storageProviderFactory } from '@shared/testing';
import { File, FilePermission, FileRefOwnerModel, RefPermModel } from './file.entity';

describe('File entity', () => {
	const storageProvider = storageProviderFactory.buildWithId();
	const mainUserId = new ObjectId().toHexString();
	const anotherUserId = new ObjectId().toHexString();
	const yetAnotherUserId = new ObjectId().toHexString();

	beforeAll(async () => {
		await setupEntities();
	});

	const copyFile = (file: File) =>
		new File({
			createdAt: file.createdAt,
			updatedAt: file.updatedAt,
			deletedAt: file.deletedAt,
			deleted: file.deleted,
			name: 'test-file-1.txt',
			size: 42,
			type: 'text/plain',
			storageFileName: '001-test-file-1.txt',
			bucket: 'bucket-001',
			storageProvider,
			thumbnail: 'https://example.com/thumbnail.png',
			thumbnailRequestToken: file.thumbnailRequestToken,
			securityCheck: file.securityCheck,
			shareTokens: file.shareTokens,
			ownerId: mainUserId,
			refOwnerModel: FileRefOwnerModel.USER,
			creatorId: mainUserId,
			permissions: file.permissions,
			versionKey: 0,
		});

	describe('removePermissionsByRefId', () => {
		it('should remove proper permission with given refId', () => {
			const file = new File({
				name: 'test-file-1.txt',
				size: 42,
				type: 'text/plain',
				storageFileName: '001-test-file-1.txt',
				bucket: 'bucket-001',
				storageProvider,
				thumbnail: 'https://example.com/thumbnail.png',
				ownerId: mainUserId,
				refOwnerModel: FileRefOwnerModel.USER,
				creatorId: mainUserId,
				permissions: [
					new FilePermission({
						refId: mainUserId,
						refPermModel: RefPermModel.USER,
					}),
					new FilePermission({
						refId: anotherUserId,
						refPermModel: RefPermModel.USER,
					}),
					new FilePermission({
						refId: yetAnotherUserId,
						refPermModel: RefPermModel.USER,
					}),
				],
				versionKey: 0,
			});

			const expectedFile = copyFile(file);

			expectedFile.permissions = [
				new FilePermission({
					refId: anotherUserId,
					refPermModel: RefPermModel.USER,
				}),
				new FilePermission({
					refId: yetAnotherUserId,
					refPermModel: RefPermModel.USER,
				}),
			];

			file.removePermissionsByRefId(mainUserId);

			expect(file).toEqual(expectedFile);
		});

		describe('should not remove any permissions', () => {
			it('if there are none at all', () => {
				const file = new File({
					name: 'test-file-1.txt',
					size: 42,
					type: 'text/plain',
					storageFileName: '001-test-file-1.txt',
					bucket: 'bucket-001',
					storageProvider,
					thumbnail: 'https://example.com/thumbnail.png',
					ownerId: mainUserId,
					refOwnerModel: FileRefOwnerModel.USER,
					creatorId: mainUserId,
					permissions: [],
					versionKey: 0,
				});

				const originalFile = copyFile(file);

				file.removePermissionsByRefId(mainUserId);

				expect(file).toEqual(originalFile);
			});

			it('if none of them contains given refId', () => {
				const file = new File({
					name: 'test-file-1.txt',
					size: 42,
					type: 'text/plain',
					storageFileName: '001-test-file-1.txt',
					bucket: 'bucket-001',
					storageProvider,
					thumbnail: 'https://example.com/thumbnail.png',
					ownerId: mainUserId,
					refOwnerModel: FileRefOwnerModel.USER,
					creatorId: mainUserId,
					permissions: [
						new FilePermission({
							refId: mainUserId,
							refPermModel: RefPermModel.USER,
						}),
						new FilePermission({
							refId: anotherUserId,
							refPermModel: RefPermModel.USER,
						}),
					],
					versionKey: 0,
				});

				const originalFile = copyFile(file);

				const randomUserId = new ObjectId().toHexString();

				file.removePermissionsByRefId(randomUserId);

				expect(file).toEqual(originalFile);
			});
		});
	});

	describe('markForDeletion', () => {
		it('should properly mark the file for deletion', () => {
			const file = new File({
				name: 'test-file-1.txt',
				size: 42,
				type: 'text/plain',
				storageFileName: '001-test-file-1.txt',
				bucket: 'bucket-001',
				storageProvider,
				thumbnail: 'https://example.com/thumbnail.png',
				ownerId: mainUserId,
				refOwnerModel: FileRefOwnerModel.USER,
				creatorId: mainUserId,
				permissions: [],
				versionKey: 0,
			});

			const expectedFile = copyFile(file);

			const fakeCurrentDate = new Date('2023-01-01');

			expectedFile.deletedAt = fakeCurrentDate;
			expectedFile.deleted = true;

			jest.useFakeTimers().setSystemTime(fakeCurrentDate);

			file.markForDeletion();

			expect(file).toEqual(expectedFile);
		});
	});

	describe('constructor', () => {
		describe('when creating a file (non-directory)', () => {
			const userId = new ObjectId().toHexString();

			it('should create file', () => {
				const file = new File({
					name: 'name',
					size: 42,
					storageFileName: 'name',
					bucket: 'bucket',
					storageProvider,
					ownerId: userId,
					refOwnerModel: FileRefOwnerModel.USER,
					creatorId: userId,
					permissions: [new FilePermission({ refId: userId, refPermModel: RefPermModel.USER })],
				});
				expect(file).toBeInstanceOf(File);
			});
			it('should throw without bucket', () => {
				const call = () =>
					new File({
						name: 'name',
						size: 42,
						storageFileName: 'name',
						storageProvider,
						ownerId: userId,
						refOwnerModel: FileRefOwnerModel.USER,
						creatorId: userId,
						permissions: [new FilePermission({ refId: userId, refPermModel: RefPermModel.USER })],
					});
				expect(call).toThrow();
			});

			it('should throw without storageFileName', () => {
				const call = () =>
					new File({
						name: 'name',
						size: 42,
						bucket: 'bucket',
						storageProvider,
						ownerId: userId,
						refOwnerModel: FileRefOwnerModel.USER,
						creatorId: userId,
						permissions: [new FilePermission({ refId: userId, refPermModel: RefPermModel.USER })],
					});
				expect(call).toThrow();
			});

			it('should throw without storageProvider', () => {
				const call = () =>
					new File({
						name: 'name',
						size: 42,
						bucket: 'bucket',
						storageFileName: 'name',
						ownerId: userId,
						refOwnerModel: FileRefOwnerModel.USER,
						creatorId: userId,
						permissions: [new FilePermission({ refId: userId, refPermModel: RefPermModel.USER })],
					});
				expect(call).toThrow();
			});
		});
	});
});
