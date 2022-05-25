import { Entity, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '../../../../shared/domain/entity/base.entity';

// This entity is used for syncing the new filerecords collection with the old files collection.
// It can be removed after transitioning file-handling to the new files-storage-microservice is completed.
export interface IFileFilerecordProperties {
	fileId: ObjectId;
	filerecordId: ObjectId;
}

@Entity({ tableName: 'files_filerecords' })
export class FileFilerecord extends BaseEntityWithTimestamps {
	@Property()
	fileId!: ObjectId;

	@Property()
	filerecordId!: ObjectId;

	constructor(props: IFileFilerecordProperties) {
		super();
		this.fileId = props.fileId;
		this.filerecordId = props.filerecordId;
	}
}
