import { ObjectId } from 'bson';

import { setupEntities, storageProviderFactory } from '@shared/testing';
import { File, FileRefOwnerModel } from './file.entity';

describe('file entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		describe('when creating a file (non-directory)', () => {
			it('should create file', () => {
				const storageProvider = storageProviderFactory.build();
				const file = new File({
					name: 'name',
					storageProvider,
					bucket: 'bucket',
					storageFileName: 'name',
					ownerId: new ObjectId(),
					refOwnerModel: FileRefOwnerModel.USER,
				});
				expect(file).toBeInstanceOf(File);
			});
			it('should throw without bucket', () => {
				const storageProvider = storageProviderFactory.build();
				const call = () =>
					new File({
						name: 'name',
						storageProvider,
						storageFileName: 'name',
						ownerId: new ObjectId(),
						refOwnerModel: FileRefOwnerModel.USER,
					});
				expect(call).toThrow();
			});

			it('should throw without storageFileName', () => {
				const storageProvider = storageProviderFactory.build();
				const call = () =>
					new File({
						name: 'name',
						storageProvider,
						bucket: 'bucket',
						ownerId: new ObjectId(),
						refOwnerModel: FileRefOwnerModel.USER,
					});
				expect(call).toThrow();
			});

			it('should throw without storageProvider', () => {
				const call = () =>
					new File({
						name: 'name',
						bucket: 'bucket',
						storageFileName: 'name',
						ownerId: new ObjectId(),
						refOwnerModel: FileRefOwnerModel.USER,
					});
				expect(call).toThrow();
			});
		});
	});
});
