import { createMock } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { FileRecordParentType } from '@src/infra/rabbitmq';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { BoardNodeCopyContext } from './board-node-copy-context';

describe(BoardNodeCopyContext.name, () => {
	describe('copyFilesOfParent', () => {
		const setup = () => {
			const contextProps = {
				sourceSchoolId: new ObjectId().toHexString(),
				targetSchoolId: new ObjectId().toHexString(),
				userId: new ObjectId().toHexString(),
				filesStorageClientAdapterService: createMock<FilesStorageClientAdapterService>(),
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
					schoolId: contextProps.sourceSchoolId,
				},
				target: {
					parentId: targetParentId,
					parentType: FileRecordParentType.BoardNode,
					schoolId: contextProps.targetSchoolId,
				},
				userId: contextProps.userId,
			});
		});
	});
});
