import { EntityId, FileRecordParentType } from '@shared/domain';

export interface IFileRequestInfo {
	schoolId: EntityId;
	parentType: FileRecordParentType;
	parentId: EntityId;
}
