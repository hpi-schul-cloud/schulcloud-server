import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BoardExternalReference, Column, ColumnBoard, EntityId, PermissionCrud } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { AuthorizationService } from '@modules/authorization/domain';
import { PermissionContextService } from '@modules/authorization';
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
		private readonly logger: LegacyLogger,
		protected readonly permissionContextService: PermissionContextService
	) {
		super(authorizationService, boardDoAuthorizableService, permissionContextService);
		this.logger.setContext(BoardUc.name);
	}

	async findBoard(userId: EntityId, boardId: EntityId): Promise<ColumnBoard> {
		this.logger.debug({ action: 'findBoard', userId, boardId });
		await this.pocCheckPermission(userId, boardId, [PermissionCrud.READ]);

		const board = await this.columnBoardService.findById(boardId);
		// await this.checkPermission(userId, board, Action.read);
		await this.pocFilterColumnBoardChildrenByPermission(userId, board);

		return board;
	}

	async findBoardContext(userId: EntityId, boardId: EntityId): Promise<BoardExternalReference> {
		this.logger.debug({ action: 'findBoardContext', userId, boardId });

		await this.pocCheckPermission(userId, boardId, [PermissionCrud.READ]);
		const board = await this.columnBoardService.findById(boardId);
		// await this.checkPermission(userId, board, Action.read);

		return board.context;
	}

	async deleteBoard(userId: EntityId, boardId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteBoard', userId, boardId });

		await this.pocCheckPermission(userId, boardId, [PermissionCrud.DELETE]);
		const board = await this.columnBoardService.findById(boardId);
		// await this.checkPermission(userId, board, Action.write);

		await this.columnBoardService.delete(board);
	}

	async updateBoardTitle(userId: EntityId, boardId: EntityId, title: string): Promise<void> {
		this.logger.debug({ action: 'updateBoardTitle', userId, boardId, title });

		await this.pocCheckPermission(userId, boardId, [PermissionCrud.UPDATE]);
		const board = await this.columnBoardService.findById(boardId);
		// await this.checkPermission(userId, board, Action.write);

		await this.columnBoardService.updateTitle(board, title);
	}

	async createColumn(userId: EntityId, boardId: EntityId): Promise<Column> {
		this.logger.debug({ action: 'createColumn', userId, boardId });

		await this.pocCheckPermission(userId, boardId, [PermissionCrud.CREATE]);
		const board = await this.columnBoardService.findById(boardId);
		// await this.checkPermission(userId, board, Action.write);

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

		await this.pocCheckPermission(userId, columnId, [PermissionCrud.UPDATE]);
		await this.pocCheckPermission(userId, targetBoardId, [PermissionCrud.UPDATE]);

		const column = await this.columnService.findById(columnId);
		const targetBoard = await this.columnBoardService.findById(targetBoardId);

		// await this.checkPermission(userId, column, Action.write);
		// await this.checkPermission(userId, targetBoard, Action.write);

		await this.columnService.move(column, targetBoard, targetPosition);
	}
}
