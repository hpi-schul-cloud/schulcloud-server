import { EntityId } from '@shared/domain';
import { FileRecordParentType } from '@infra/rabbitmq';

export interface IFileDomainObjectProps {
	id: EntityId;
	name: string;
	parentType: FileRecordParentType;
	parentId: EntityId;
}
