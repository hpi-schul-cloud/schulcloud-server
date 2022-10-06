import { EntityId, FileRecordParentType } from '@shared/domain';

export interface FileRequestInfo {
	schoolId: EntityId;
	parentType: FileRecordParentType;
	parentId: EntityId;
}
