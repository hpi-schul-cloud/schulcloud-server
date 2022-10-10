import { EntityId } from '@shared/domain';
import { FileRecordParentType } from '@shared/infra/rabbitmq';

export interface IFileDomainObjectProps {
	id: EntityId;
	name: string;
	parentType: FileRecordParentType;
	parentId: EntityId;
}
