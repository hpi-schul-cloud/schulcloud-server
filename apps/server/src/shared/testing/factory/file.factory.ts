import { ObjectId } from 'bson';

import { File, FileRefOwnerModel, FileProps } from '@shared/domain';

import { BaseFactory } from './base.factory';
import { storageProviderFactory } from './storageprovider.factory';
import { userFactory } from './user.factory';

export const userFileFactory = BaseFactory.define<File, FileProps>(File, ({ sequence }) => {
	return {
		storageFileName: `file-${sequence}`,
		bucket: 'test-bucket',
		storageProvider: storageProviderFactory.build(),
		isDirectory: false,
		creator: userFactory.build(),
		name: `file-${sequence}`,
		ownerId: new ObjectId(),
		refOwnerModel: FileRefOwnerModel.USER,
	};
});
