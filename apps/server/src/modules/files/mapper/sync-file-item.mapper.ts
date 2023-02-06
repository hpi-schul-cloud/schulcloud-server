/* istanbul ignore file */

import { ObjectId } from '@mikro-orm/mongodb';
import { FileRecordEntity, FileRecordParentType } from '@src/modules/files-storage/repo/filerecord.entity';
import { SyncFileItem, SyncFileItemData, SyncSourceFileData } from '../types';
import { SyncSourceFileMapper } from './sync-source-file.mapper';
import { SyncTargetFileMapper } from './sync-target-file.mapper';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
export class SyncFileItemMapper {
	static mapResults(itemDataList: SyncFileItemData[], parentType: FileRecordParentType): SyncFileItem[] {
		const items = itemDataList.map((itemData) => this.mapToDomain(itemData, parentType));

		return items;
	}

	private static mapToDomain(data: SyncFileItemData, parentType: FileRecordParentType): SyncFileItem {
		const file = data.file as SyncSourceFileData;
		const fileRecord = data.filerecord as FileRecordEntity;
		const source = SyncSourceFileMapper.mapToDomain(file);
		const target = data.filerecord ? SyncTargetFileMapper.mapToDomain(fileRecord) : undefined;

		const item = new SyncFileItem({
			parentType,
			parentId: (data._id as ObjectId).toHexString(),
			creatorId: (file.creator as ObjectId)?.toHexString(),
			schoolId: (data.schoolId as ObjectId).toHexString(),
			source,
			target,
			fileRecord,
			created: false,
		});

		return item;
	}
}
