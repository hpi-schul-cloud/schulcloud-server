import { FileRecordParentType } from '@shared/infra/rabbitmq';
import {
	FileRecord,
	FileSecurityCheck,
	IFileRecordProperties,
} from '@src/modules/files-storage/entity/filerecord.entity';
import { ObjectId } from 'bson';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';

const yesterday = new Date(Date.now() - 86400000);

class FileRecordFactory extends BaseFactory<FileRecord, IFileRecordProperties> {
	markedForDelete(): this {
		const params: DeepPartial<IFileRecordProperties> = { deletedSince: yesterday };
		return this.params(params);
	}
}

export const fileRecordFactory = FileRecordFactory.define(FileRecord, ({ sequence }) => {
	return {
		size: Math.round(Math.random() * 100000),
		name: `file-record #${sequence}`,
		mimeType: 'application/octet-stream',
		securityCheck: new FileSecurityCheck({}),
		parentType: FileRecordParentType.Course,
		parentId: new ObjectId(),
		creatorId: new ObjectId(),
		schoolId: new ObjectId(),
	};
});
