import { EntityId } from '@shared/domain/types';
import { FileRecordParentType } from '@src/infra/rabbitmq';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { CopyFileDto } from '@src/modules/files-storage-client/dto';
import { CopyContext } from './board-node-copy.service';

export type BoardNodeCopyContextProps = {
	sourceSchoolId: EntityId;
	targetSchoolId: EntityId;
	userId: EntityId;
	filesStorageClientAdapterService: FilesStorageClientAdapterService;
};

export class BoardNodeCopyContext implements CopyContext {
	constructor(private readonly props: BoardNodeCopyContextProps) {}

	copyFilesOfParent(sourceParentId: EntityId, targetParentId: EntityId): Promise<CopyFileDto[]> {
		return this.props.filesStorageClientAdapterService.copyFilesOfParent({
			source: {
				parentId: sourceParentId,
				parentType: FileRecordParentType.BoardNode,
				schoolId: this.props.sourceSchoolId,
			},
			target: {
				parentId: targetParentId,
				parentType: FileRecordParentType.BoardNode,
				schoolId: this.props.targetSchoolId,
			},
			userId: this.props.userId,
		});
	}
}
