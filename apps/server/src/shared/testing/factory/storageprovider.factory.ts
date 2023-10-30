import { IStorageProviderProperties, StorageProviderEntity } from '@shared/domain/entity/storageprovider.entity';
import { BaseFactory } from './base.factory';

export const storageProviderFactory = BaseFactory.define<StorageProviderEntity, IStorageProviderProperties>(
	StorageProviderEntity,
	() => {
		return {
			endpointUrl: 'http://localhost',
			accessKeyId: 'accessKeyId',
			secretAccessKey: 'secret',
		};
	}
);
