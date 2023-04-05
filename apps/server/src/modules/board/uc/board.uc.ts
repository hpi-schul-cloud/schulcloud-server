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

		const board = await this.columnBoardService.findById(boardId);

		// TODO check permissions

		await this.columnBoardService.delete(board);
	}

	async createColumn(userId: EntityId, boardId: EntityId): Promise<Column> {
		this.logger.debug({ action: 'createColumn', userId, boardId });

		const board = await this.columnBoardService.findById(boardId);

		// TODO check permissions

		const column = await this.columnService.create(board);
		return column;
	}

	async deleteColumn(userId: EntityId, columnId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteColumn', userId, columnId });

		const column = await this.columnService.findById(columnId);

		// TODO check permissions

		await this.columnService.delete(column);
	}

	async moveColumn(
		userId: EntityId,
		columnId: EntityId,
		targetBoardId: EntityId,
		targetPosition: number
	): Promise<void> {
		this.logger.debug({ action: 'moveColumn', userId, columnId, targetBoardId, targetPosition });

		const column = await this.columnService.findById(columnId);
		const targetBoard = await this.columnBoardService.findById(targetBoardId);

		// TODO check permissions

		await this.columnService.move(column, targetBoard, targetPosition);
	}

	async createCard(userId: EntityId, columnId: EntityId): Promise<Card> {
		this.logger.debug({ action: 'createCard', userId, columnId });

		const column = await this.columnService.findById(columnId);

		// TODO: check Permissions
		const card = await this.cardService.create(column);

		return card;
	}

	async moveCard(userId: EntityId, cardId: EntityId, targetColumnId: EntityId, targetPosition: number): Promise<void> {
		this.logger.debug({ action: 'moveCard', userId, cardId, targetColumnId, toPosition: targetPosition });

		const card = await this.cardService.findById(cardId);
		const targetColumn = await this.columnService.findById(targetColumnId);

		// TODO check permissions

		await this.cardService.move(card, targetColumn, targetPosition);
	}

	async updateColumnTitle(userId: EntityId, columnId: EntityId, title: string): Promise<void> {
		this.logger.debug({ action: 'updateColumnTitle', userId, columnId, title });

		const column = await this.columnService.findById(columnId);

		// TODO check permissions

		await this.columnService.updateTitle(column, title);
	}

	async deleteCard(userId: EntityId, cardId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteCard', userId, cardId });

		const card = await this.cardService.findById(cardId);

		// TODO check permissions

		await this.cardService.delete(card);
	}
}
