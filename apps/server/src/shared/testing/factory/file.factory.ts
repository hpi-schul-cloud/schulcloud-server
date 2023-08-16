import { FileEntity, FilePermission, FileProps, FileRefOwnerModel, RefPermModel } from '@shared/domain';

import { BaseFactory } from './base.factory';
import { storageProviderFactory } from './storageprovider.factory';
import { userFactory } from './user.factory';

export const userFileFactory = BaseFactory.define<FileEntity, FileProps>(FileEntity, ({ sequence }) => {
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
		permissions: [new FilePermission({ refId: userId, refPermModel: RefPermModel.USER })],
	};
});
