import { Action } from '@modules/authorization';
import { AuthorizationService } from '@modules/authorization/domain';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BoardExternalReference, Column, ColumnBoard } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { CardService, ColumnBoardService, ColumnService } from '../service';
import { BoardDoAuthorizableService } from '../service/board-do-authorizable.service';
import { BaseUc } from './base.uc';

@Injectable()
export class BoardUc extends BaseUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		protected readonly authorizationService: AuthorizationService,
		protected readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly cardService: CardService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly columnService: ColumnService,
		private readonly logger: LegacyLogger
	) {
		super(authorizationService, boardDoAuthorizableService);
		this.logger.setContext(BoardUc.name);
	}

	async findBoard(userId: EntityId, boardId: EntityId): Promise<ColumnBoard> {
		this.logger.debug({ action: 'findBoard', userId, boardId });

		const board = await this.columnBoardService.findById(boardId);
		await this.checkPermission(userId, board, Action.read);

		return board;
	}

	async findBoardContext(userId: EntityId, boardId: EntityId): Promise<BoardExternalReference> {
		this.logger.debug({ action: 'findBoardContext', userId, boardId });

		const board = await this.columnBoardService.findById(boardId);
		await this.checkPermission(userId, board, Action.read);

		return board.context;
	}

	async deleteBoard(userId: EntityId, boardId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteBoard', userId, boardId });

		const board = await this.columnBoardService.findById(boardId);
		await this.checkPermission(userId, board, Action.write);

		await this.columnBoardService.delete(board);
	}

	async updateBoardTitle(userId: EntityId, boardId: EntityId, title: string): Promise<void> {
		this.logger.debug({ action: 'updateBoardTitle', userId, boardId, title });

		const board = await this.columnBoardService.findById(boardId);
		await this.checkPermission(userId, board, Action.write);

		await this.columnBoardService.updateTitle(board, title);
	}

	async createColumn(userId: EntityId, boardId: EntityId): Promise<Column> {
		this.logger.debug({ action: 'createColumn', userId, boardId });

		const board = await this.columnBoardService.findById(boardId);
		await this.checkPermission(userId, board, Action.write);

		const column = await this.columnService.create(board);
		return column;
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

		await this.checkPermission(userId, column, Action.write);
		await this.checkPermission(userId, targetBoard, Action.write);

		await this.columnService.move(column, targetBoard, targetPosition);
	}

	async updateVisibility(userId: EntityId, boardId: EntityId, isVisible: boolean): Promise<void> {
		const board = await this.columnBoardService.findById(boardId);
		await this.checkPermission(userId, board, Action.write);

		await this.columnBoardService.updateBoardVisibility(boardId, isVisible);
	}
}
