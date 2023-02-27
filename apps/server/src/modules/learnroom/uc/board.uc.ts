import { Injectable } from '@nestjs/common';
import { ColumnBoard, EntityId } from '@shared/domain';
import { ColumnBoardRepo } from '@shared/repo';

@Injectable()
export class BoardUC {
	constructor(private readonly columnBoardRepo: ColumnBoardRepo) {}

	async findBoard(userId: EntityId, boardId: EntityId): Promise<ColumnBoard> {
		// TODO check permissions
		const board = await this.columnBoardRepo.findById(boardId);
		return board;
	}
}
