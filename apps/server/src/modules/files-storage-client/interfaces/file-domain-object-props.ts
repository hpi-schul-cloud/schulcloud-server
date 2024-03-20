import { FileRecordParentType } from '@infra/rabbitmq';
import { EntityId } from '@shared/domain/types';

export interface FileDomainObjectProps {
	id: EntityId;
	name: string;
	parentType: FileRecordParentType;
	parentId: EntityId;
	createdAt?: Date;
	updatedAt?: Date;
}
