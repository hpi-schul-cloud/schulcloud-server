import { ObjectId } from 'bson';

import { setupEntities, storageProviderFactory } from '@shared/testing';
import { File, FileRefOwnerModel } from './file.entity';

describe('file entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		describe('when creating a file (non-directory)', () => {
			const userId = new ObjectId().toHexString();

			it('should create file', () => {
				const storageProvider = storageProviderFactory.build();
				const file = new File({
					name: 'name',
					size: 42,
					storageFileName: 'name',
					bucket: 'bucket',
					storageProvider,
					ownerId: userId,
					refOwnerModel: FileRefOwnerModel.USER,
					creatorId: userId,
				});
				expect(file).toBeInstanceOf(File);
			});
			it('should throw without bucket', () => {
				const storageProvider = storageProviderFactory.build();
				const call = () =>
					new File({
						name: 'name',
						size: 42,
						storageFileName: 'name',
						storageProvider,
						ownerId: userId,
						refOwnerModel: FileRefOwnerModel.USER,
						creatorId: userId,
					});
				expect(call).toThrow();
			});

			it('should throw without storageFileName', () => {
				const storageProvider = storageProviderFactory.build();
				const call = () =>
					new File({
						name: 'name',
						size: 42,
						bucket: 'bucket',
						storageProvider,
						ownerId: userId,
						refOwnerModel: FileRefOwnerModel.USER,
						creatorId: userId,
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
					});
				expect(call).toThrow();
			});
		});
	});
});
