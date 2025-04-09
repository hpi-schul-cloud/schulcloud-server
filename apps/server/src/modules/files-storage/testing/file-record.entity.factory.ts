import { FileRecordParentType } from '@infra/rabbitmq';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { StorageLocation } from '../domain/interface';
import { FileRecordEntity, FileRecordProperties, FileRecordSecurityCheckEmbeddable } from '../repo/filerecord.entity';

const yesterday = new Date(Date.now() - 86400000);

class FileRecordEntityFactory extends BaseFactory<FileRecordEntity, FileRecordProperties> {
	public markedForDelete(): this {
		const params: DeepPartial<FileRecordProperties> = { deletedSince: yesterday };
		return this.params(params);
	}
}

export const fileRecordEntityFactory = FileRecordEntityFactory.define(FileRecordEntity, ({ sequence }) => {
	return {
		size: Math.round(Math.random() * 100000),
		name: `file-record #${sequence}`,
		mimeType: 'application/octet-stream',
		securityCheck: new FileRecordSecurityCheckEmbeddable({}),
		parentType: FileRecordParentType.Course,
		parentId: new ObjectId().toHexString(),
		creatorId: new ObjectId().toHexString(),
		storageLocationId: new ObjectId().toHexString(),
		storageLocation: StorageLocation.SCHOOL,
	};
});
