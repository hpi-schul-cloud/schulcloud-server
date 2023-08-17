import { FileEntity, FilePermissionEntity, FileEntityProps } from '@shared/domain';
import { FileOwnerModel, FilePermissionReferenceModel } from '@src/modules/files/domain';

import { BaseFactory } from './base.factory';
import { storageProviderFactory } from './storageprovider.factory';
import { userFactory } from './user.factory';

export const userFileFactory = BaseFactory.define<FileEntity, FileEntityProps>(FileEntity, ({ sequence }) => {
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
		refOwnerModel: FileOwnerModel.USER,
		creatorId: userId,
		permissions: [new FilePermissionEntity({ refId: userId, refPermModel: FilePermissionReferenceModel.USER })],
	};
});
