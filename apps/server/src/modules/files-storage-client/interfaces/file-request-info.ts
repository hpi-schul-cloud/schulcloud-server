import { FileRecordParentType } from '@infra/rabbitmq';
import { EntityId } from '@shared/domain/types';

export interface FileRequestInfo {
	schoolId: EntityId;
	parentType: FileRecordParentType;
	parentId: EntityId;
}
