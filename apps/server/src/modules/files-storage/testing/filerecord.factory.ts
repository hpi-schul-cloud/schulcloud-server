import { FileRecordParentType } from '@infra/rabbitmq';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { FileRecord, FileRecordProperties, FileRecordSecurityCheck } from '../entity';
import { StorageLocation } from '../interface';

const yesterday = new Date(Date.now() - 86400000);

class FileRecordFactory extends BaseFactory<FileRecord, FileRecordProperties> {
	public markedForDelete(): this {
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
