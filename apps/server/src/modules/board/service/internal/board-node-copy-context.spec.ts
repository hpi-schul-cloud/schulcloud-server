import { createMock } from '@golevelup/ts-jest';
import { StorageLocation } from '@infra/files-storage-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { FileRecordParentType, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { BoardNodeCopyContext, BoardNodeCopyContextProps } from './board-node-copy-context';

describe(BoardNodeCopyContext.name, () => {
	describe('copyFilesOfParent', () => {
		const setup = () => {
			const contextProps: BoardNodeCopyContextProps = {
				sourceStorageLocationReference: { id: new ObjectId().toHexString(), type: StorageLocation.SCHOOL },
				targetStorageLocationReference: { id: new ObjectId().toHexString(), type: StorageLocation.SCHOOL },
				userId: new ObjectId().toHexString(),
				filesStorageClientAdapterService: createMock<FilesStorageClientAdapterService>(),
				targetSchoolId: new ObjectId().toHexString(),
			};

			const copyContext = new BoardNodeCopyContext(contextProps);

			const sourceParentId = new ObjectId().toHexString();
			const targetParentId = new ObjectId().toHexString();

			return { contextProps, copyContext, sourceParentId, targetParentId };
		};

		it('should use the service to copy the files', async () => {
			const { contextProps, copyContext, sourceParentId, targetParentId } = setup();

			await copyContext.copyFilesOfParent(sourceParentId, targetParentId);

			expect(contextProps.filesStorageClientAdapterService.copyFilesOfParent).toHaveBeenCalledWith({
				source: {
					parentId: sourceParentId,
					parentType: FileRecordParentType.BoardNode,
					storageLocationId: contextProps.sourceStorageLocationReference.id,
					storageLocation: contextProps.sourceStorageLocationReference.type,
				},
				target: {
					parentId: targetParentId,
					parentType: FileRecordParentType.BoardNode,
					storageLocationId: contextProps.targetStorageLocationReference.id,
					storageLocation: contextProps.targetStorageLocationReference.type,
				},
				userId: contextProps.userId,
			});
		});
	});
});
