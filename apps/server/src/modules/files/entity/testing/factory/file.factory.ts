import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory, storageProviderFactory } from '@shared/testing';
import { FileEntity, FileEntityProps, FilePermissionEntity } from '../..';
import { FileOwnerModel, FilePermissionReferenceModel } from '../../../domain';

export const userFileFactory = BaseFactory.define<FileEntity, FileEntityProps>(FileEntity, ({ sequence }) => {
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
		permissions: [
			new FilePermissionEntity({
				refId: userId,
				refPermModel: FilePermissionReferenceModel.USER,
			}),
		],
		versionKey: 0,
	};
});
