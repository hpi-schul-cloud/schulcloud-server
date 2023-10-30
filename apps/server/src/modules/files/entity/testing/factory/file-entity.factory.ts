import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing/factory/base.factory';
import { storageProviderFactory } from '@shared/testing/factory/storageprovider.factory';
import { FileOwnerModel } from '@src/modules/files/domain/types/file-owner-model.enum';
import { FileEntity, FileEntityProps } from '../../file.entity';
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
