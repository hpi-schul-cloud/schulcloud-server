import { EntityId, FileRecordParentType } from '@shared/domain';

export interface IFileDomainObjectProps {
	id: EntityId;
	name: string;
	parentType: FileRecordParentType;
	parentId: EntityId;
}
