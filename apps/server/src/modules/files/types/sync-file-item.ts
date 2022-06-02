import { EntityId, FileRecord, FileRecordParentType } from '@shared/domain';
import { SyncSourceFile } from './sync-source-file';
import { SyncTargetFile } from './sync-target-file';

export class SyncFileItem {
	parentType: FileRecordParentType;

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
