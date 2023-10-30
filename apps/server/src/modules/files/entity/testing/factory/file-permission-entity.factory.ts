import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing/factory/base.factory';
import { FilePermissionReferenceModel } from '@src/modules/files/domain/types/file-permission-reference-model.enum';
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
