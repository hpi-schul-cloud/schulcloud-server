import { EntityId } from '@shared/domain';
import { FileRecordParent } from '@shared/infra/rabbitmq';

export interface IFileRequestInfo {
	schoolId: EntityId;
	parentType: FileRecordParent;
	parentId: EntityId;
}
