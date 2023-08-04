import { File, IFileProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';
import { storageProviderFactory } from './storageprovider.factory';
import { userFactory } from './user.factory';

export const fileFactory = BaseFactory.define<File, IFileProperties>(File, ({ sequence }) => {
	return {
		storageFileName: `file-${sequence}`,
		bucket: 'test-bucket',
		storageProvider: storageProviderFactory.build(),
		isDirectory: false,
		creator: userFactory.build(),
		name: `file-${sequence}`,
	};
});
