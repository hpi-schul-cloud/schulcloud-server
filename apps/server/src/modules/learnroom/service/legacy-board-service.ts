import { Injectable } from '@nestjs/common';
import { Board, BoardElement, BoardElementType, EntityId } from '@shared/domain';
import { BoardRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { ColumnBoardService } from '@src/modules/board';

@Injectable()
export class LegacyBoardService {
	constructor(
		private readonly logger: LegacyLogger,
		private readonly boardRepo: BoardRepo,
		private readonly columnBoardService: ColumnBoardService
	) {}

	async findByCourseId(courseId: EntityId): Promise<Board> {
		const board = await this.boardRepo.findByCourseId(courseId);
		await this.ensureContainsPinnwand(board);
		return board;
	}

	private async ensureContainsPinnwand(board: Board): Promise<Board> {
		const containsColumnBoard = (ref: BoardElement) => ref.boardElementType === BoardElementType.ColumnBoard;
		if (board.references.getItems().some(containsColumnBoard) === false) {
			const columnBoard = await this.columnBoardService.create();
			// TODO: ensure columnBoard contains reference to course
			board.references.add(columnBoard);
		}
		return board;
	}
}
