import { Injectable } from '@nestjs/common';
import { Card, Column, ColumnBoard, EntityId } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { CardService, ColumnBoardService, ColumnService } from '../service';

@Injectable()
export class BoardUc {
	constructor(
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

		await this.columnBoardService.delete(boardId);
	}

	async createColumn(userId: EntityId, boardId: EntityId): Promise<Column> {
		this.logger.debug({ action: 'createColumn', userId, boardId });

		const board = await this.columnBoardService.findById(boardId);

		// TODO check permissions

		const column = await this.columnService.create(board);
		return column;
	}

	async deleteColumn(userId: EntityId, boardId: EntityId, columnId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteColumn', userId, boardId, columnId });

		const board = await this.columnBoardService.findById(boardId);

		// TODO check permissions

		await this.columnService.delete(board, columnId);
	}

	async moveColumn(userId: EntityId, boardId: EntityId, columnId: EntityId, toIndex: number): Promise<void> {
		this.logger.debug({ action: 'moveColumn', userId, boardId, columnId });

		// TODO check permissions

		await this.columnService.move(columnId, boardId, toIndex);
	}

	async createCard(userId: EntityId, boardId: EntityId, columnId: EntityId): Promise<Card> {
		this.logger.debug({ action: 'createCard', userId, boardId, columnId });

		const column = await this.columnService.findById(columnId);

		// TODO: check Permissions
		const card = await this.cardService.create(column);

		return card;
	}

	async deleteCard(userId: EntityId, cardId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteCard', userId, cardId });

		const card = await this.cardService.findById(cardId);

		// TODO check permissions

		await this.cardService.delete(card);
	}

	async moveCard(userId: EntityId, cardId: EntityId, targetColumnId: EntityId, toIndex: number): Promise<void> {
		this.logger.debug({ action: 'moveCard', userId, cardId, targetColumnId, toIndex });

		const sourceColumn = await this.columnService.findByChildId(cardId);
		const targetColumn = await this.columnService.findById(targetColumnId);

		await this.cardService.move(sourceColumn, cardId, targetColumn, toIndex);
	}
}
