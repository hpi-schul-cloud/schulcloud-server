import { EntityId } from '@shared/domain';
import { FileRecordParamsParentTypeEnum } from '../filesStorageApi/v3';

export interface IFileDomainObjectProps {
	id: EntityId;
	name: string;
	parentType: FileRecordParamsParentTypeEnum;
	parentId: EntityId;
	schoolId: EntityId;
}
