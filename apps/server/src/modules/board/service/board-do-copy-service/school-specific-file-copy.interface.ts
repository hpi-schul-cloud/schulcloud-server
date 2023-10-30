import { EntityId } from '@shared/domain/types/entity-id';
import { FileRecordParentType } from '@shared/infra/rabbitmq/exchange/files-storage';
import { CopyFileDto } from '@src/modules/files-storage-client/dto/copy-file.dto';

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
