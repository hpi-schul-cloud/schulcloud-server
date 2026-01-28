import { StorageLocation } from '@infra/files-storage-client';
import { CopyFileDto, FileRecordParentType, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { EntityId } from '@shared/domain/types';
import { CopyContext } from './board-node-copy.service';

export type StorageLocationReference = {
	id: EntityId;
	type: StorageLocation;
};

export type BoardNodeCopyContextProps = {
	sourceStorageLocationReference: StorageLocationReference;
	targetStorageLocationReference: StorageLocationReference;
	userId: EntityId;
	filesStorageClientAdapterService: FilesStorageClientAdapterService;
	targetSchoolId: EntityId;
};

export class BoardNodeCopyContext implements CopyContext {
	public readonly targetSchoolId: EntityId;

	public readonly userId: EntityId;

	constructor(private readonly props: BoardNodeCopyContextProps) {
		this.targetSchoolId = props.targetSchoolId;
		this.userId = props.userId;
	}

	public copyFilesOfParent(sourceParentId: EntityId, targetParentId: EntityId): Promise<CopyFileDto[]> {
		return this.props.filesStorageClientAdapterService.copyFilesOfParent({
			source: {
				parentId: sourceParentId,
				parentType: FileRecordParentType.BoardNode,
				storageLocationId: this.props.sourceStorageLocationReference.id,
				storageLocation: this.props.sourceStorageLocationReference.type,
			},
			target: {
				parentId: targetParentId,
				parentType: FileRecordParentType.BoardNode,
				storageLocationId: this.props.targetStorageLocationReference.id,
				storageLocation: this.props.targetStorageLocationReference.type,
			},
			userId: this.props.userId,
		});
	}
}
