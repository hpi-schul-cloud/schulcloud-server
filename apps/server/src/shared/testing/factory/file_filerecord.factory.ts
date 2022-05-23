import { ObjectId } from '@mikro-orm/mongodb';
import { FileFilerecord, IFileFilerecordProperties } from '@shared/domain/entity/file_filerecord.entity';
import { BaseFactory } from './base.factory';

// This factory is used for syncing the new filerecords collection with the old files collection.
// It can be removed after transitioning file-handling to the new files-storage-microservice is completed.
export const fileFilerecordFactory = BaseFactory.define<FileFilerecord, IFileFilerecordProperties>(
	FileFilerecord,
	() => {
		return {
			fileId: new ObjectId(),
			filerecordId: new ObjectId(),
		};
	}
);
