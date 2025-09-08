import { CopyStatus } from '@modules/copy-helper';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client/service';
import { Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BoardExternalReference, BoardExternalReferenceType, ColumnBoard, isColumnBoard } from '../../domain';
import { BoardNodeService } from '../board-node.service';
import { BoardNodeCopyContext, StorageLocationReference } from './board-node-copy-context';
import { BoardNodeCopyService } from './board-node-copy.service';
import { ColumnBoardTitleService } from './column-board-title.service';

export type CopyColumnBoardParams = {
	originalColumnBoardId: EntityId;
	targetExternalReference: BoardExternalReference;
	sourceStorageLocationReference: StorageLocationReference;
	targetStorageLocationReference: StorageLocationReference;
	userId: EntityId;
	copyTitle?: string;
	targetSchoolId: EntityId;
};

@Injectable()
export class ColumnBoardCopyService {
	constructor(
		private readonly boardNodeService: BoardNodeService,
		private readonly columnBoardTitleService: ColumnBoardTitleService,
		private readonly boardNodeCopyService: BoardNodeCopyService,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService
	) {}

	public async copyColumnBoard(params: CopyColumnBoardParams): Promise<CopyStatus> {
		const originalBoard = await this.boardNodeService.findByClassAndId(ColumnBoard, params.originalColumnBoardId);

		this.checkSupportedExternalReferenceType(params.targetExternalReference.type);

		const copyContext = new BoardNodeCopyContext({
			sourceStorageLocationReference: params.sourceStorageLocationReference,
			targetStorageLocationReference: params.targetStorageLocationReference,
			userId: params.userId,
			filesStorageClientAdapterService: this.filesStorageClientAdapterService,
			targetSchoolId: params.targetSchoolId,
		});

		const copyStatus = await this.boardNodeCopyService.copy(originalBoard, copyContext);

		/* istanbul ignore next */
		if (!isColumnBoard(copyStatus.copyEntity)) {
			throw new InternalServerErrorException('expected copy of columnboard to be a columnboard');
		}

		if (params.copyTitle) {
			copyStatus.copyEntity.title = params.copyTitle;
		} else {
			copyStatus.copyEntity.title = await this.columnBoardTitleService.deriveColumnBoardTitle(
				originalBoard.title,
				params.targetExternalReference
			);
		}
		copyStatus.copyEntity.context = params.targetExternalReference;
		copyStatus.copyEntity.isVisible = false;
		await this.boardNodeService.addRoot(copyStatus.copyEntity);
		copyStatus.originalEntity = originalBoard;

		return copyStatus;
	}

	private checkSupportedExternalReferenceType(type: BoardExternalReferenceType): void {
		/* istanbul ignore next */
		if (type !== BoardExternalReferenceType.Course && type !== BoardExternalReferenceType.Room) {
			throw new NotImplementedException('Only room and course external reference types are supported');
		}
	}
}
