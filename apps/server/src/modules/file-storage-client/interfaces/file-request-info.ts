import { EntityId, FileRecordParentType } from '@shared/domain';

export interface FileRequestInfo {
	jwt: string; // todo replace with existing type
	schoolId: EntityId;
	parentType: FileRecordParentType;
	parentId: EntityId;
}
