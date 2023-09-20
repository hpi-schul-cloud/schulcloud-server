import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory, storageProviderFactory } from '@shared/testing';
import { FileEntity, FileEntityProps } from '../..';
import { FileOwnerModel } from '../../../domain';
import { filePermissionEntityFactory } from './file-permission-entity.factory';

export const fileEntityFactory = BaseFactory.define<FileEntity, FileEntityProps>(FileEntity, ({ sequence }) => {
	const userId = new ObjectId().toHexString();

	return {
		name: `test-file-${sequence}.txt`,
		size: Math.floor(Math.random() * 4200) + 1,
		type: 'plain/text',
		storageFileName: `00${sequence}-test-file-${sequence}.txt`,
		bucket: `bucket-00${sequence}`,
		storageProvider: storageProviderFactory.buildWithId(),
		thumbnail: 'https://example.com/thumbnail.png',
		ownerId: userId,
		refOwnerModel: FileOwnerModel.USER,
		creatorId: userId,
		permissions: [filePermissionEntityFactory.build({ refId: userId })],
		versionKey: 0,
	};
});
