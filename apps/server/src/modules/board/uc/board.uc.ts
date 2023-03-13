import { Injectable } from '@nestjs/common';
import { ColumnBoard, EntityId } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { ColumnBoardService } from '../service/board.service';

@Injectable()
export class BoardUc {
	constructor(private readonly columnBoardService: ColumnBoardService, private readonly logger: Logger) {
		this.logger.setContext(BoardUc.name);
	}

	async findBoard(userId: EntityId, boardId: EntityId): Promise<ColumnBoard> {
		this.logger.debug({ action: 'findBoard', userId, boardId });

		// TODO check permissions
		const board = await this.columnBoardService.findById(boardId);
		return board;
	}

	async createBoard(userId: EntityId): Promise<ColumnBoard> {
		this.logger.debug({ action: 'createBoard', userId });

		// TODO check permissions

		const board = this.columnBoardService.createBoard();

		return board;
	}
}
