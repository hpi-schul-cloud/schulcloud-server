import { FileRecordParentType } from '@infra/rabbitmq';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { FileRecord, FileRecordProps, FileRecordSecurityCheck } from '../domain';
import { StorageLocation } from '../domain/interface';

export const fileRecordFactory = BaseFactory.define<FileRecord, FileRecordProps>(FileRecord, ({ sequence }) => {
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
