import { File, FileRefOwnerModel, FileProps } from '@shared/domain';

import { BaseFactory } from './base.factory';
import { storageProviderFactory } from './storageprovider.factory';
import { userFactory } from './user.factory';

export const userFileFactory = BaseFactory.define<File, FileProps>(File, ({ sequence }) => {
	const user = userFactory.build();
	const userId = user.id;

	return {
		isDirectory: false,
		name: `file-${sequence}`,
		size: 42,
		storageFileName: `file-${sequence}`,
		bucket: 'test-bucket',
		storageProvider: storageProviderFactory.build(),
		ownerId: userId,
		refOwnerModel: FileRefOwnerModel.USER,
		creatorId: userId,
	};
});
