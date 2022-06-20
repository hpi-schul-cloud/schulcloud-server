import { EntityId } from '@shared/domain';
import { FileRecordParamsParentTypeEnum } from '../fileStorageApi/v3';

export interface IFileDomainObjectProps {
	id: EntityId;
	name: string;
	parentType: FileRecordParamsParentTypeEnum;
	parentId: EntityId;
	schoolId: EntityId;
}
