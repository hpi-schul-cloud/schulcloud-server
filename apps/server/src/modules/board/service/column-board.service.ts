import { CopyStatus } from '@modules/copy-helper';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BoardExternalReference, BoardExternalReferenceType, ColumnBoard, isColumnBoard } from '../domain';
import { BoardNodeRepo } from '../repo';
import { BoardNodeService } from './board-node.service';
import { ColumnBoardCopyService, ColumnBoardLinkService } from './internal';

@Injectable()
export class ColumnBoardService {
	constructor(
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly boardNodeService: BoardNodeService,
		private readonly columnBoardCopyService: ColumnBoardCopyService,
		private readonly columnBoardLinkService: ColumnBoardLinkService
	) {}

	async findById(id: EntityId, depth?: number): Promise<ColumnBoard> {
		const columnBoard = this.boardNodeService.findByClassAndId(ColumnBoard, id, depth);

		return columnBoard;
	}

	async findByExternalReference(reference: BoardExternalReference, depth?: number): Promise<ColumnBoard[]> {
		const boardNodes = await this.boardNodeRepo.findByExternalReference(reference, depth);

		const boards = boardNodes.filter((bn) => isColumnBoard(bn));

		return boards;
	}

	async updateVisibility(columnBoard: ColumnBoard, visibility: boolean): Promise<void> {
		await this.boardNodeService.updateVisibility(columnBoard, visibility);
	}

	// called from feathers
	// TODO remove when not needed anymore
	async deleteByCourseId(courseId: EntityId): Promise<void> {
		const boardNodes = await this.findByExternalReference({
			type: BoardExternalReferenceType.Course,
			id: courseId,
		});

		await this.boardNodeRepo.delete(boardNodes);
	}

	async copyColumnBoard(props: {
		originalColumnBoardId: EntityId;
		destinationExternalReference: BoardExternalReference;
		userId: EntityId;
		copyTitle?: string;
	}): Promise<CopyStatus> {
		const copyStatus = await this.columnBoardCopyService.copyColumnBoard(props);

		return copyStatus;
	}

	async swapLinkedIds(boardId: EntityId, idMap: Map<EntityId, EntityId>): Promise<ColumnBoard> {
		const board = await this.columnBoardLinkService.swapLinkedIds(boardId, idMap);

		return board;
	}
}
