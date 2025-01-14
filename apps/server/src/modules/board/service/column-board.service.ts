import { CopyStatus } from '@modules/copy-helper';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import {
	BoardExternalReference,
	BoardExternalReferenceType,
	ColumnBoard,
	ColumnBoardProps,
	isColumnBoard,
} from '../domain';
import { BoardNodeRepo } from '../repo';
import { BoardNodeService } from './board-node.service';
import { ColumnBoardCopyService, ColumnBoardLinkService, CopyColumnBoardParams } from './internal';

@Injectable()
export class ColumnBoardService {
	constructor(
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly boardNodeService: BoardNodeService,
		private readonly columnBoardCopyService: ColumnBoardCopyService,
		private readonly columnBoardLinkService: ColumnBoardLinkService
	) {}

	public async findById(id: EntityId, depth?: number): Promise<ColumnBoard> {
		const columnBoard = await this.boardNodeService.findByClassAndId(ColumnBoard, id, depth);

		return columnBoard;
	}

	public async findByExternalReference(reference: BoardExternalReference, depth?: number): Promise<ColumnBoard[]> {
		const boardNodes = await this.boardNodeRepo.findByExternalReference(reference, depth);

		const boards = boardNodes.filter((bn) => isColumnBoard(bn));

		return boards;
	}

	public async updateVisibility(columnBoard: ColumnBoard, visibility: boolean): Promise<void> {
		await this.boardNodeService.updateVisibility(columnBoard, visibility);
	}

	// called from feathers
	// TODO remove when not needed anymore
	public async deleteByCourseId(courseId: EntityId): Promise<void> {
		const boardNodes = await this.findByExternalReference({
			type: BoardExternalReferenceType.Course,
			id: courseId,
		});

		await this.boardNodeRepo.delete(boardNodes);
	}

	public async copyColumnBoard(params: CopyColumnBoardParams): Promise<CopyStatus> {
		const copyStatus = await this.columnBoardCopyService.copyColumnBoard(params);

		return copyStatus;
	}

	public async swapLinkedIds(boardId: EntityId, idMap: Map<EntityId, EntityId>): Promise<ColumnBoard> {
		const board = await this.columnBoardLinkService.swapLinkedIds(boardId, idMap);

		return board;
	}

	public async createColumnBoard(props: ColumnBoardProps): Promise<ColumnBoard> {
		const columnBoard = new ColumnBoard(props);

		await this.boardNodeRepo.save(columnBoard);

		return columnBoard;
	}
}
