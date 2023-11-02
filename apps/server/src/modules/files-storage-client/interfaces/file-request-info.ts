import { EntityId } from '@shared/domain';
import { FileRecordParentType } from '@shared/infra/rabbitmq';

export interface FileRequestInfo {
	schoolId: EntityId;
	parentType: FileRecordParentType;
	parentId: EntityId;
}
