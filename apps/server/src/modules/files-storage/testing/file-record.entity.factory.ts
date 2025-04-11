import { FileRecordParentType } from '@infra/rabbitmq';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { FileRecordProps, FileRecordSecurityCheck } from '../domain';
import { StorageLocation } from '../domain/interface';
import { FileRecordEntity } from '../repo/file-record.entity';

const yesterday = new Date(Date.now() - 86400000);

class FileRecordEntityFactory extends BaseFactory<FileRecordEntity, FileRecordProps> {
	public markedForDelete(): this {
		const params: DeepPartial<FileRecordProps> = { deletedSince: yesterday };
		return this.params(params);
	}
}

export const fileRecordEntityFactory = FileRecordEntityFactory.define(FileRecordEntity, ({ sequence }) => {
	const props = {
		id: new ObjectId().toHexString(),
		size: Math.round(Math.random() * 100000),
		name: `file-record #${sequence}`,
		mimeType: 'application/octet-stream',
		securityCheck: FileRecordSecurityCheck.createWithDefaultProps(),
		parentType: FileRecordParentType.Course,
		parentId: new ObjectId().toHexString(),
		creatorId: new ObjectId().toHexString(),
		storageLocationId: new ObjectId().toHexString(),
		storageLocation: StorageLocation.SCHOOL,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	console.log('props', JSON.stringify(props));

	return props;
});
