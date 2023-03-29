import { Injectable } from '@nestjs/common';
import { Column, ColumnBoard, EntityId } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { BoardDoService, ColumnBoardService } from '../service';

@Injectable()
export class BoardUc {
	constructor(
		private readonly boardDoService: BoardDoService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly logger: LegacyLogger
	) {
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

		const board = await this.columnBoardService.createBoard();
		return board;
	}

	async deleteBoard(userId: EntityId, boardId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteBoard', userId, boardId });

		// TODO check permissions

		await this.boardDoService.deleteWithDescendants(boardId);
	}

	async createColumn(userId: EntityId, boardId: EntityId): Promise<Column> {
		this.logger.debug({ action: 'createColumn', userId, boardId });

		const board = await this.columnBoardService.findById(boardId);

		// TODO check permissions

		const column = await this.columnBoardService.createColumn(board.id);
		return column;
	}

	async deleteColumn(userId: EntityId, boardId: EntityId, columnId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteColumn', userId, boardId, columnId });

		const board = await this.columnBoardService.findById(boardId);

		// TODO check permissions

		await this.boardDoService.deleteChild(board, columnId);
	}
}
