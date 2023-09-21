import { EntityId } from '@shared/domain';
import { CopyFileDto } from '@src/modules/files-storage-client/dto';
import { FileRecordParentType } from '@src/modules/files-storage/entity';

export type SchoolSpecificFileCopyServiceCopyParams = {
	sourceParentId: EntityId;
	targetParentId: EntityId;
	parentType: FileRecordParentType;
};

export type SchoolSpecificFileCopyServiceProps = {
	sourceSchoolId: EntityId;
	targetSchoolId: EntityId;
	userId: EntityId;
};

export interface SchoolSpecificFileCopyService {
	copyFilesOfParent(params: SchoolSpecificFileCopyServiceCopyParams): Promise<CopyFileDto[]>;
}
