import { CopyFileDto } from '@modules/files-storage-client/dto';
import { FileRecordParentType } from '@modules/files-storage/entity';
import { EntityId } from '@shared/domain/types';

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