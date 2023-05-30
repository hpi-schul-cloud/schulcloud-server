import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import {
	Board,
	BoardElement,
	BoardElementType,
	BoardExternalReferenceType,
	ColumnboardBoardElement,
	ColumnBoardNode,
	EntityId,
} from '@shared/domain';
import { BoardRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { ColumnBoardService } from '@src/modules/board';

@Injectable()
export class LegacyBoardService {
	constructor(
		private readonly logger: LegacyLogger,
		private readonly boardRepo: BoardRepo,
		private readonly columnBoardService: ColumnBoardService,
		private readonly em: EntityManager
	) {}

	async findByCourseId(courseId: EntityId): Promise<Board> {
		const board = await this.boardRepo.findByCourseId(courseId);
		await this.ensureContainsPinnwand(board);
		return board;
	}

	// WIP : BC-3573 : check if code from legacy-board-repo should move here

	private async ensureContainsPinnwand(board: Board): Promise<Board> {
		const isColumnBoard = (ref: BoardElement) => ref.boardElementType === BoardElementType.ColumnBoard;

		const references = board.references.getItems();
		if (references.some(isColumnBoard) === false) {
			const course = board.course;

			const columnBoard = await this.columnBoardService.create({
				id: course.id,
				type: BoardExternalReferenceType.Course,
			});

			const columnBoardNode = await this.em.findOneOrFail(ColumnBoardNode, { id: columnBoard.id });
			const boardElement = new ColumnboardBoardElement({ target: columnBoardNode });

			board.references.set([boardElement, ...references]);
			await this.boardRepo.save(board);
		}
		return board;
	}
}
