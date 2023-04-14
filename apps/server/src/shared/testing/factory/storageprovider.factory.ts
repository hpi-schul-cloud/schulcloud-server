import { StorageProvider, IStorageProviderProperties } from '@shared/domain';
import { BaseEntityTestFactory } from './base-entity-test.factory';

export const storageProviderFactory = BaseEntityTestFactory.define<StorageProvider, IStorageProviderProperties>(
	StorageProvider,
	() => {
		return {
			endpointUrl: 'http://localhost',
			accessKeyId: 'accessKeyId',
			secretAccessKey: 'secret',
		};
	}
);
