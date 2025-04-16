import { FileRecordParentType } from '@infra/rabbitmq';
import { ObjectId } from '@mikro-orm/mongodb';
import { EntityFactory } from '@testing/factory/entity.factory';
import { FileRecordProps, FileRecordSecurityCheck, ScanStatus } from '../domain';
import { StorageLocation } from '../domain/interface';
import { FileRecordEntity } from '../repo/file-record.entity';

const yesterday = new Date(Date.now() - 86400000);

class FileRecordEntityFactory extends EntityFactory<FileRecordEntity, FileRecordProps> {
	public withDeletedSince(date?: Date): this {
		return this.params({ deletedSince: date ?? yesterday });
	}

	public withScanStatus(scanStatus?: ScanStatus): this {
		return this.params({ securityCheck: { status: scanStatus ?? ScanStatus.VERIFIED } });
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

	return props;
});
