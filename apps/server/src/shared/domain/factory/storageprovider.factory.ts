import { StorageProvider } from '../entity/storageprovider.entity';

export const storageProviderFactory = {
	build: (props?: { endpointUrl?: string; accessKeyId?: string; secretAccessKeyId?: string }): StorageProvider => {
		const storageProvider = new StorageProvider({
			endpointUrl: 'http://localhost',
			accessKeyId: 'accessKeyId',
			secretAccessKey: 'secret',
			...props,
		});
		return storageProvider;
	},
};
