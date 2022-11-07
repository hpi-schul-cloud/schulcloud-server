/* istanbul ignore file */

import { EntityId } from '@shared/domain';
import { FileRecord, FileRecordParent } from '@src/modules/files-storage/entity/filerecord.entity';
import { SyncSourceFile } from './sync-source-file';
import { SyncTargetFile } from './sync-target-file';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
export class SyncFileItem {
	parentType: FileRecordParent;

	parentId: EntityId;

	creatorId: EntityId;

	schoolId: EntityId;

	source: SyncSourceFile;

	target?: SyncTargetFile;

	fileRecord: FileRecord;

	created = false;

	constructor(props: SyncFileItem) {
		this.parentType = props.parentType;
		this.parentId = props.parentId;
		this.creatorId = props.creatorId;
		this.schoolId = props.schoolId;
		this.target = props.target;
		this.source = props.source;
		this.fileRecord = props.fileRecord;
		this.created = props.created;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SyncFileItemData = Record<string, any>;
