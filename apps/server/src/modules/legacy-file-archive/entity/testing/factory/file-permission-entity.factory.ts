import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { FilePermissionEntity, FilePermissionEntityProps } from '../..';
import { OwnerType } from '../../../domain';

export const filePermissionEntityFactory = BaseFactory.define<FilePermissionEntity, FilePermissionEntityProps>(
	FilePermissionEntity,
	() => {
		return {
			refId: new ObjectId().toHexString(),
			refPermModel: OwnerType.USER,
		};
	}
);
