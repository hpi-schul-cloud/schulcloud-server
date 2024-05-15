import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing/factory';
import { FilePermissionEntity, FilePermissionEntityProps } from '../..';
import { FilePermissionReferenceModel } from '../../../domain';

export const filePermissionEntityFactory = BaseFactory.define<FilePermissionEntity, FilePermissionEntityProps>(
	FilePermissionEntity,
	() => {
		return {
			refId: new ObjectId().toHexString(),
			refPermModel: FilePermissionReferenceModel.USER,
		};
	}
);
