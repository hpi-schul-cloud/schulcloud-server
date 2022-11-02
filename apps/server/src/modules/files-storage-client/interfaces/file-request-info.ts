import { EntityId } from '@shared/domain';
import { FileRecordParentType } from '@src/modules/files-storage/entity/filerecord.entity';

export interface IFileRequestInfo {
	schoolId: EntityId;
	parentType: FileRecordParentType;
	parentId: EntityId;
}
