import { FileRecordParentType } from '@infra/rabbitmq';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { StorageLocation } from '../domain/interface';
import { FileRecordEntity, FileRecordProperties, FileRecordSecurityCheck } from '../repo/filerecord.entity';

const yesterday = new Date(Date.now() - 86400000);

class FileRecordFactory extends BaseFactory<FileRecordEntity, FileRecordProperties> {
	public markedForDelete(): this {
		const params: DeepPartial<FileRecordProperties> = { deletedSince: yesterday };
		return this.params(params);
	}
}

export const fileRecordFactory = FileRecordFactory.define(FileRecordEntity, ({ sequence }) => {
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
