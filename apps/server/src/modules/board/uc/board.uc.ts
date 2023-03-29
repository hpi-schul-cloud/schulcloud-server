import { Injectable } from '@nestjs/common';
import { Card, Column, ColumnBoard, EntityId } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { BoardDoService, CardService, ColumnBoardService, ColumnService } from '../service';

@Injectable()
export class BoardUc {
	constructor(
		private readonly boardDoService: BoardDoService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly columnService: ColumnService,
		private readonly cardService: CardService,
		private readonly logger: Logger
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

		const board = await this.columnBoardService.create();
		return board;
	}

	async deleteBoard(userId: EntityId, boardId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteBoard', userId, boardId });

		// TODO check permissions

		await this.columnBoardService.deleteById(boardId);
	}

	async createColumn(userId: EntityId, boardId: EntityId): Promise<Column> {
		this.logger.debug({ action: 'createColumn', userId, boardId });

		const board = await this.columnBoardService.findById(boardId);

		// TODO check permissions

		const column = await this.columnService.create(board.id);
		return column;
	}

	async deleteColumn(userId: EntityId, boardId: EntityId, columnId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteColumn', userId, boardId, columnId });

		// const board = await this.columnBoardService.findById(boardId);

		// TODO check permissions

		await this.columnService.deleteById(columnId);
	}

	async createCard(userId: EntityId, boardId: EntityId, columnId: EntityId): Promise<Card> {
		this.logger.debug({ action: 'createCard', userId, boardId, columnId });

		// TODO: check Permissions
		const card = await this.cardService.create(columnId);

		return card;
	}

	async deleteCard(userId: EntityId, boardId: EntityId, columnId: EntityId, cardId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteCard', userId, boardId, columnId, cardId });

		// TODO check permissions

		await this.cardService.deleteById(cardId);
	}
}
