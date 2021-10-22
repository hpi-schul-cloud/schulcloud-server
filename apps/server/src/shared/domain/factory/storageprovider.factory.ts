import { StorageProvider } from '../entity/storageprovider.entity';

export const storageProviderFactory = {
	build: (props?: Partial<StorageProvider>): StorageProvider => {
		const storageProvider = new StorageProvider({
			endpointUrl: 'http://localhost',
			accessKeyId: 'accessKeyId',
			secretAccessKey: 'secret',
			...props,
		});
		return storageProvider;
	},
};
