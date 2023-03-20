import { setupEntities, storageProviderFactory } from '@shared/testing';
import { File } from './file.entity';

describe('file entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		describe('when creating a file (non-directory)', () => {
			it('should create file', () => {
				const storageProvider = storageProviderFactory.build();
				const file = new File({ name: 'name', storageProvider, bucket: 'bucket', storageFileName: 'name' });
				expect(file).toBeInstanceOf(File);
			});
			it('should throw without bucket', () => {
				const storageProvider = storageProviderFactory.build();
				const call = () => new File({ name: 'name', storageProvider, storageFileName: 'name' });
				expect(call).toThrow();
			});

			it('should throw without storageFileName', () => {
				const storageProvider = storageProviderFactory.build();
				const call = () => new File({ name: 'name', storageProvider, bucket: 'bucket' });
				expect(call).toThrow();
			});

			it('should throw without storageProvider', () => {
				const call = () => new File({ name: 'name', bucket: 'bucket', storageFileName: 'name' });
				expect(call).toThrow();
			});
		});
	});
});
