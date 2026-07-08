import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';
import { FileRecordParentType, type FileRequestInfo, StorageLocation } from '../interfaces';

export const fileRequestInfoFactory = Factory.define<FileRequestInfo>(() => {
	return {
		parentType: FileRecordParentType.Task,
		parentId: new ObjectId().toHexString(),
		storageLocationId: new ObjectId().toHexString(),
		storageLocation: StorageLocation.SCHOOL,
	};
});
