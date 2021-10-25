import { StorageProvider, IStorageProviderProperties } from '../entity/storageprovider.entity';
import { BaseFactory } from './base.factory';

export const storageProviderFactory = BaseFactory.define<StorageProvider, IStorageProviderProperties>(
	StorageProvider,
	() => {
		return {
			endpointUrl: 'http://localhost',
			accessKeyId: 'accessKeyId',
			secretAccessKey: 'secret',
		};
	}
);
