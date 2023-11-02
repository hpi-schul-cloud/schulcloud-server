import { EntityId } from '@shared/domain';
import { FileRecordParentType } from '@shared/infra/rabbitmq';

export interface FileDomainObjectProps {
	id: EntityId;
	name: string;
	parentType: FileRecordParentType;
	parentId: EntityId;
}
