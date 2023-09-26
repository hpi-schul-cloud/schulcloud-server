import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { CopyFileDto } from '@src/modules/files-storage-client/dto';
import {
	SchoolSpecificFileCopyService,
	SchoolSpecificFileCopyServiceCopyParams,
	SchoolSpecificFileCopyServiceProps,
} from './school-specific-file-copy.interface';

export class SchoolSpecificFileCopyServiceImpl implements SchoolSpecificFileCopyService {
	constructor(
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		private readonly props: SchoolSpecificFileCopyServiceProps
	) {}

	public async copyFilesOfParent(params: SchoolSpecificFileCopyServiceCopyParams): Promise<CopyFileDto[]> {
		return this.filesStorageClientAdapterService.copyFilesOfParent({
			source: {
				parentId: params.sourceParentId,
				parentType: params.parentType,
				schoolId: this.props.sourceSchoolId,
			},
			target: {
				parentId: params.targetParentId,
				parentType: params.parentType,
				schoolId: this.props.targetSchoolId,
			},
			userId: this.props.userId,
		});
	}
}
