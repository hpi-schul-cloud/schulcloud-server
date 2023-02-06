import { FileRecordParentType } from '@shared/infra/rabbitmq';
import {
	FileRecordEntity,
	FileSecurityCheck,
	IFileRecordProperties,
} from '@src/modules/files-storage/repo/filerecord.entity';
import { ObjectId } from 'bson';
import { DeepPartial } from 'fishery';
import { BaseFactory } from '../../../shared/testing/factory/base.factory';

const yesterday = new Date(Date.now() - 86400000);

class FileRecordEntityFactory extends BaseFactory<FileRecordEntity, IFileRecordProperties> {
	markedForDelete(): this {
		const params: DeepPartial<IFileRecordProperties> = { deletedSince: yesterday };
		return this.params(params);
	}
}

export const fileRecordEntityFactory = FileRecordEntityFactory.define(FileRecordEntity, ({ sequence }) => {
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
