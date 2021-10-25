import { File, IFileProperties } from '../entity/file.entity';
import { storageProviderFactory } from './storageprovider.factory';
import { userFactory } from './user.factory';
import { BaseFactory } from './base.factory';

export const fileFactory = BaseFactory.define<File, IFileProperties>(File, ({ sequence }) => {
	return {
		storageFileName: `storageFileName-${sequence}`,
		bucket: 'test-bucket',
		storageProvider: storageProviderFactory.build(),
		creator: userFactory.build(),
	};
});
