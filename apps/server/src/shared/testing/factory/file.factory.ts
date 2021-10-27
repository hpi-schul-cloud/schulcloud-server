import { File, Directory, IFileProperties } from '@shared/domain';
import { storageProviderFactory } from './storageprovider.factory';
import { userFactory } from './user.factory';
import { BaseFactory } from './base.factory';

export const fileFactory = BaseFactory.define<File, IFileProperties>(File, ({ sequence }) => {
	return {
		storageFileName: `file-${sequence}`,
		bucket: 'test-bucket',
		storageProvider: storageProviderFactory.build(),
		creator: userFactory.build(),
	};
});

/* istanbul ignore next */
export const directoryFactory = BaseFactory.define<Directory, IFileProperties>(Directory, ({ sequence }) => {
	return {
		storageFileName: `directory-${sequence}`,
		bucket: 'test-bucket',
		storageProvider: storageProviderFactory.build(),
		creator: userFactory.build(),
	};
});
