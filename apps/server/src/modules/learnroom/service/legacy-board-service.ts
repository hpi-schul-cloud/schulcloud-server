import { Injectable } from '@nestjs/common';
import { Board, BoardElement, BoardElementType, BoardExternalReferenceType, EntityId } from '@shared/domain';
import { BoardRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { ColumnBoardService } from '@src/modules/board';
import { ObjectId } from 'bson';

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

	// WIP : BC-3573 : check if code from legacy-board-repo should move here

	private async ensureContainsPinnwand(board: Board): Promise<Board> {
		const containsColumnBoard = (ref: BoardElement) => ref.boardElementType === BoardElementType.ColumnBoard;

		const references = board.references.getItems();
		if (references.some(containsColumnBoard) === false) {
			const course = board.course;
			const columnBoard = await this.columnBoardService.create({
				id: course.id,
				type: BoardExternalReferenceType.Course,
			});
			const boardElement = BoardElement.FromColumnBoard(columnBoard);
			boardElement._id = new ObjectId();
			boardElement.id = boardElement._id.toHexString();
			console.log('ColumnBoard boardElement', boardElement);
			board.references.set([boardElement, ...references]);
		}
		return board;
	}
}
