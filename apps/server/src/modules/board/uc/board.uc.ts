import { Injectable } from '@nestjs/common';
import { Card, Column, ColumnBoard, EntityId, Permission } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { Action } from '@src/modules/authorization/types/action.enum';
import { CardService, ColumnBoardService, ColumnService } from '../service';
import { BoardDoAuthorizableService } from '../service/board-do-authorizable.service';

@Injectable()
export class BoardUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly cardService: CardService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly columnService: ColumnService,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(BoardUc.name);
	}

	async findBoard(userId: EntityId, boardId: EntityId): Promise<ColumnBoard> {
		this.logger.debug({ action: 'findBoard', userId, boardId });

		const user = await this.authorizationService.getUserWithPermissions(userId);

		const boardDoAuthorizable = await this.boardDoAuthorizableService.findById(boardId);

		const context = {
			action: Action.read, // scope-related permission
			requiredPermissions: [Permission.COURSE_EDIT], // school-wide permissions
		};

		// const context = AuthorizationContextBuilder.read([Permission.COURSE_EDIT]);

		this.authorizationService.checkPermission(user, boardDoAuthorizable, context);

		const board = await this.columnBoardService.findById(boardId);

		return board;
	}

	async deleteBoard(userId: EntityId, boardId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteBoard', userId, boardId });

		const board = await this.columnBoardService.findById(boardId);

		// TODO check permissions

		await this.columnBoardService.delete(board);
	}

	async updateBoardTitle(userId: EntityId, boardId: EntityId, title: string): Promise<void> {
		this.logger.debug({ action: 'updateBoardTitle', userId, boardId, title });

		const board = await this.columnBoardService.findById(boardId);

		// TODO check permissions

		await this.columnBoardService.updateTitle(board, title);
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

	async updateColumnTitle(userId: EntityId, columnId: EntityId, title: string): Promise<void> {
		this.logger.debug({ action: 'updateColumnTitle', userId, columnId, title });

		const column = await this.columnService.findById(columnId);

		// TODO check permissions

		await this.columnService.updateTitle(column, title);
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

	async updateCardTitle(userId: EntityId, cardId: EntityId, title: string): Promise<void> {
		this.logger.debug({ action: 'updateCardTitle', userId, cardId, title });

		const card = await this.cardService.findById(cardId);

		// TODO check permissions

		await this.cardService.updateTitle(card, title);
	}

	async deleteCard(userId: EntityId, cardId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteCard', userId, cardId });

		const card = await this.cardService.findById(cardId);

		// TODO check permissions

		await this.cardService.delete(card);
	}
}
