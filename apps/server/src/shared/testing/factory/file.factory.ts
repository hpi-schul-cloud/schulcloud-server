import { Directory, File, IFileProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';
import { storageProviderFactory } from './storageprovider.factory';
import { userFactory } from './user.factory';

export const fileFactory = BaseFactory.define<File, IFileProperties>(File, ({ sequence }) => {
	return {
		storageFileName: `file-${sequence}`,
		bucket: 'test-bucket',
		storageProvider: storageProviderFactory.build(),
		creator: userFactory.build(),
		name: `file-${sequence}`,
	};
});

/* istanbul ignore next */
export const directoryFactory = BaseFactory.define<Directory, IFileProperties>(Directory, ({ sequence }) => {
	return {
		storageFileName: `directory-${sequence}`,
		bucket: 'test-bucket',
		storageProvider: storageProviderFactory.build(),
		creator: userFactory.build(),
		name: `directory-${sequence}`,
	};
});
