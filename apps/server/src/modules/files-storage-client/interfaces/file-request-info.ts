import { EntityId } from '@shared/domain';
import { FileRecordParamsParentTypeEnum } from '../filesStorageApi/v3';

export interface FileRequestInfo {
	jwt: string; // todo replace with existing type
	schoolId: EntityId;
	parentType: FileRecordParamsParentTypeEnum;
	parentId: EntityId;
}
