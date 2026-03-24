import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { FilePermissionReferenceModel } from '../../../domain';
import { FilePermissionEntity, FilePermissionEntityProps } from '../../file-permission.entity';

export const filePermissionEntityFactory = BaseFactory.define<FilePermissionEntity, FilePermissionEntityProps>(
	FilePermissionEntity,
	() => {
		return {
			refId: new ObjectId().toHexString(),
			refPermModel: FilePermissionReferenceModel.USER,
		};
	}
);
