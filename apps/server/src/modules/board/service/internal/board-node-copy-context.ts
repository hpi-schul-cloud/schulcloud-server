import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { CopyFileDto } from '@modules/files-storage-client/dto';
import { StorageLocation } from '@modules/files-storage/entity';
import { EntityId } from '@shared/domain/types';
import { FileRecordParentType } from '@src/infra/rabbitmq';
import { CopyContext } from './board-node-copy.service';

export type BoardNodeCopyContextProps = {
	sourceStorageLocationId: EntityId;
	targetStorageLocationId: EntityId;
	userId: EntityId;
	sourceStorageLocation: StorageLocation;
	targetStorageLocation: StorageLocation;
	filesStorageClientAdapterService: FilesStorageClientAdapterService;
};

export class BoardNodeCopyContext implements CopyContext {
	constructor(private readonly props: BoardNodeCopyContextProps) {}

	copyFilesOfParent(sourceParentId: EntityId, targetParentId: EntityId): Promise<CopyFileDto[]> {
		return this.props.filesStorageClientAdapterService.copyFilesOfParent({
			source: {
				parentId: sourceParentId,
				parentType: FileRecordParentType.BoardNode,
				storageLocationId: this.props.sourceStorageLocationId,
				storageLocation: this.props.sourceStorageLocation,
			},
			target: {
				parentId: targetParentId,
				parentType: FileRecordParentType.BoardNode,
				storageLocationId: this.props.targetStorageLocationId,
				storageLocation: this.props.targetStorageLocation,
			},
			userId: this.props.userId,
		});
	}
}
