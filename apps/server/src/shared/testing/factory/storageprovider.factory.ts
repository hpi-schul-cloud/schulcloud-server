import { StorageProviderEntity, StorageProviderProperties } from '@shared/domain/entity';
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
