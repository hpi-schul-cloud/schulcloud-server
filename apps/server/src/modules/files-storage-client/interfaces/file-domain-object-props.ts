import { EntityId } from '@shared/domain/types';
import { FileRecordParentType } from './files-storage';

export interface FileDomainObjectProps {
	id: EntityId;
	name: string;
	parentType: FileRecordParentType;
	parentId: EntityId;
	createdAt?: Date;
	updatedAt?: Date;
}
