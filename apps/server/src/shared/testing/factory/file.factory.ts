import { File, IFileProperties } from '@shared/domain';
import { BaseEntityTestFactory } from './base-entity-test.factory';
import { storageProviderFactory } from './storageprovider.factory';
import { userFactory } from './user.factory';

export const fileFactory = BaseEntityTestFactory.define<File, IFileProperties>(File, ({ sequence }) => {
	return {
		storageFileName: `file-${sequence}`,
		bucket: 'test-bucket',
		storageProvider: storageProviderFactory.build(),
		isDirectory: false,
		creator: userFactory.build(),
		name: `file-${sequence}`,
	};
});

export const directoryFactory = BaseEntityTestFactory.define<File, IFileProperties>(File, ({ sequence }) => {
	return {
		isDirectory: true,
		creator: userFactory.build(),
		name: `directory-${sequence}`,
	};
});
