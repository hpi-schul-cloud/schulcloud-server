import { BaseFactory } from '@testing/factory/base.factory';
import { StorageProviderEntity, type StorageProviderProperties } from '../repo';

export const storageProviderFactory = BaseFactory.define<StorageProviderEntity, StorageProviderProperties>(
	StorageProviderEntity,
	() => {
		return {
			endpointUrl: 'http://localhost',
			accessKeyId: 'accessKeyId',
			secretAccessKey: 'secret',
		};
	}
);
