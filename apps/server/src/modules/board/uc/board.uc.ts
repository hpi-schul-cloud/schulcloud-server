import { Injectable } from '@nestjs/common';
import { ColumnBoard, EntityId } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { ColumnBoardRepo } from '../repo';

@Injectable()
export class BoardUc {
	constructor(private readonly columnBoardRepo: ColumnBoardRepo, private readonly logger: Logger) {
		this.logger.setContext(BoardUc.name);
	}

	async findBoard(userId: EntityId, boardId: EntityId): Promise<ColumnBoard> {
		this.logger.debug({ action: 'findBoard', userId, boardId });

		// TODO check permissions
		const board = await this.columnBoardRepo.findById(boardId);
		return board;
	}
}
