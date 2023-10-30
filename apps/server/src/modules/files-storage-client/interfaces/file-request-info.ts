import { EntityId } from '@shared/domain/types/entity-id';
import { FileRecordParentType } from '@shared/infra/rabbitmq/exchange/files-storage';

export interface IFileRequestInfo {
	schoolId: EntityId;
	parentType: FileRecordParentType;
	parentId: EntityId;
}
