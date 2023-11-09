import { EntityId } from '@shared/domain';
import { FileRecordParentType } from '@shared/infra/rabbitmq';

export interface IFileRequestInfo {
	schoolId: EntityId;
	parentType: FileRecordParentType;
	parentId: EntityId;
}
