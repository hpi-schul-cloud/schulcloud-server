import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';
import { type CopyFilesRequestInfo, FileRecordParentType, StorageLocation } from '../interfaces';

export const copyFilesRequestInfoFactory = Factory.define<CopyFilesRequestInfo>(({ params }) => {
	return {
		userId: params.userId ?? new ObjectId().toHexString(),
		source: {
			storageLocationId: new ObjectId().toHexString(),
			storageLocation: StorageLocation.SCHOOL,
			parentType: FileRecordParentType.Task,
			parentId: new ObjectId().toHexString(),
			...params.source,
		},
		target: {
			storageLocationId: new ObjectId().toHexString(),
			storageLocation: StorageLocation.SCHOOL,
			parentType: FileRecordParentType.Task,
			parentId: new ObjectId().toHexString(),
			...params.target,
		},
	};
});
