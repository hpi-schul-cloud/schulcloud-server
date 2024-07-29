import { FileRecordParentType } from '@infra/rabbitmq';
import { ObjectId } from '@mikro-orm/mongodb';
import { FileRecord, FileRecordProperties, FileRecordSecurityCheck } from '@modules/files-storage/entity';
import { StorageLocation } from '@modules/files-storage/interface';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';

const yesterday = new Date(Date.now() - 86400000);

class FileRecordFactory extends BaseFactory<FileRecord, FileRecordProperties> {
	markedForDelete(): this {
		const params: DeepPartial<FileRecordProperties> = { deletedSince: yesterday };
		return this.params(params);
	}
}

export const fileRecordFactory = FileRecordFactory.define(FileRecord, ({ sequence }) => {
	return {
		size: Math.round(Math.random() * 100000),
		name: `file-record #${sequence}`,
		mimeType: 'application/octet-stream',
		securityCheck: new FileRecordSecurityCheck({}),
		parentType: FileRecordParentType.Course,
		parentId: new ObjectId().toHexString(),
		creatorId: new ObjectId().toHexString(),
		storageLocationId: new ObjectId().toHexString(),
		storageLocation: StorageLocation.SCHOOL,
	};
});
