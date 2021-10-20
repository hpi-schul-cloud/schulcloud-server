import { File } from '../entity/file.entity';
import { storageProviderFactory } from './storageprovider.factory';
import { userFactory } from './user.factory';

export const fileFactory = {
	build: (props?: Partial<File>): File => {
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
