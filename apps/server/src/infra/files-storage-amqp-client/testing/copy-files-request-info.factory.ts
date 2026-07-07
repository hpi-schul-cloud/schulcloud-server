import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';
import { CopyFilesRequestInfo, FileRecordParentType, StorageLocation } from '../interfaces';

export const copyFilesRequestInfoFactory = Factory.define<CopyFilesRequestInfo>(() => {
	return {
		userId: new ObjectId().toHexString(),
		source: {
			storageLocationId: new ObjectId().toHexString(),
			storageLocation: StorageLocation.SCHOOL,
			parentType: FileRecordParentType.Task,
			parentId: new ObjectId().toHexString(),
		},
		target: {
			storageLocationId: new ObjectId().toHexString(),
			storageLocation: StorageLocation.SCHOOL,
			parentType: FileRecordParentType.Task,
			parentId: new ObjectId().toHexString(),
		},
	};
});
