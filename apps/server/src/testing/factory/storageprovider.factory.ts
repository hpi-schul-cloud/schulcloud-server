import { StorageProviderEntity, StorageProviderProperties } from '@modules/school/repo';
import { BaseFactory } from './base.factory';

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
