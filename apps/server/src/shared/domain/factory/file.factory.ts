import { File } from '../entity/file.entity';
import type { User } from '../entity/user.entity';
import { storageProviderFactory, userFactory } from './storageprovider.factory';

export const fileFactory = {
	build: (props?: { storageFileName?: string; bucket?: string; deletedAt?: Date; creator?: User }): File => {
		const file = new File({
			storageFileName: 'storageFileName',
			bucket: 'test-bucket',
			deletedAt: undefined,
			storageProvider: storageProviderFactory.build(),
            creator: userFactory.build(),
			...props,
		});
		return file;
	},
};
