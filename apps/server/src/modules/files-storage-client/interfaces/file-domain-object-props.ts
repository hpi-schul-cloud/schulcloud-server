import { EntityId } from '@shared/domain';
import { FileRecordParent } from '@shared/infra/rabbitmq';

export interface IFileDomainObjectProps {
	id: EntityId;
	name: string;
	parentType: FileRecordParent;
	parentId: EntityId;
}
