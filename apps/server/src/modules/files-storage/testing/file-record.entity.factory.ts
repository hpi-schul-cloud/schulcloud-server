import { FileRecordParentType } from '@infra/rabbitmq';
import { ObjectId } from '@mikro-orm/mongodb';
import { EntityFactory } from '@testing/factory/entity.factory';
import { FileRecordProps } from '../domain';
import { StorageLocation } from '../domain/interface';
import { FileRecordEntity } from '../repo/file-record.entity';
import { fileRecordSecurityCheckEmbeddableFactory } from './file-record-security-check.embeddable.factory';

const yesterday = new Date(Date.now() - 86400000);

class FileRecordEntityFactory extends EntityFactory<FileRecordEntity, FileRecordProps> {
	public withDeletedSince(date?: Date): this {
		return this.params({ deletedSince: date ?? yesterday });
	}
}

export const fileRecordEntityFactory = FileRecordEntityFactory.define(FileRecordEntity, ({ sequence }) => {
	const props = {
		id: new ObjectId().toHexString(),
		size: Math.round(Math.random() * 100000),
		name: `file-record #${sequence}`,
		mimeType: 'application/octet-stream',
		securityCheck: fileRecordSecurityCheckEmbeddableFactory.build(),
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
