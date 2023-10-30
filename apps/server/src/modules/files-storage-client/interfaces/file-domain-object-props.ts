import { EntityId } from '@shared/domain/types/entity-id';
import { FileRecordParentType } from '@shared/infra/rabbitmq/exchange/files-storage';

export interface IFileDomainObjectProps {
	id: EntityId;
	name: string;
	parentType: FileRecordParentType;
	parentId: EntityId;
}
