import { FileRecordParentType } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { SyncFileItem, SyncFileItemData, SyncSourceFileData, SyncTargetFileData } from '../types';
import { SyncSourceFileMapper } from './sync-source-file.mapper';
import { SyncTargetFileMapper } from './sync-target-file.mapper';

export class SyncFileItemMapper {
	static mapToDomain(data: SyncFileItemData, parentType: FileRecordParentType): SyncFileItem {
		const file = data.file as SyncSourceFileData;
		const filerecord = data.filerecord as SyncTargetFileData;
		const source = SyncSourceFileMapper.mapToDomain(file);
		const target = data.filerecord ? SyncTargetFileMapper.mapToDomain(filerecord) : undefined;

		const item = new SyncFileItem({
			parentType,
			parentId: (data._id as ObjectId).toHexString(),
			creatorId: (file.creator as ObjectId)?.toHexString(),
			schoolId: (data.schoolId as ObjectId).toHexString(),
			source,
			target,
		});

		return item;
	}
}
