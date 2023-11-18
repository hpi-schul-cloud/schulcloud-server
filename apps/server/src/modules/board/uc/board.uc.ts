import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { BoardExternalReference, Column, ColumnBoard, EntityId, Permission } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { AuthorizationService } from '@modules/authorization/domain';
import { Action, PermissionContextService } from '@modules/authorization';
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
		super(authorizationService, boardDoAuthorizableService);
		this.logger.setContext(BoardUc.name);
	}

	private async pocHasPermission(
		userId: EntityId,
		contextReference: EntityId,
		permissionsToContain: Permission[]
	): Promise<boolean> {
		this.logger.debug({ action: 'pocHasPermission', userId, contextReference, permissionsToContain });
		const permissions = await this.permissionContextService.resolvePermissions(userId, contextReference);
		const hasPermission = permissionsToContain.every((permission) => permissions.includes(permission));
		return hasPermission;
	}

	private async pocCheckPermission(
		userId: EntityId,
		contextReference: EntityId,
		permissionsToContain: Permission[]
	): Promise<void> {
		const hasPermission = await this.pocHasPermission(userId, contextReference, permissionsToContain);
		if (!hasPermission) {
			throw new UnauthorizedException();
		}
	}

	private async pocFilterColumnBoardChildrenByPermission(userId: EntityId, columnBoard: ColumnBoard): Promise<void> {
		// NOTE: This function will be obsolete once the authorization can be applied in the repo level
		const columnsToRemove = await Promise.all(
			columnBoard.children.map(async (child) => {
				return {
					column: child,
					hasPermission: await this.pocHasPermission(userId, child.id, [Permission.BOARD_READ]),
				};
			})
		);

		columnsToRemove.forEach((columnToRemove) => {
			if (!columnToRemove.hasPermission) {
				columnBoard.removeChild(columnToRemove.column);
			}
		});

		const cardsToRemove = await Promise.all(
			columnBoard.children
				.flatMap((child) => child.children)
				.map(async (child) => {
					return {
						card: child,
						hasPermission: await this.pocHasPermission(userId, child.id, [Permission.BOARD_READ]),
					};
				})
		);

		cardsToRemove.forEach((cardToRemove) => {
			if (!cardToRemove.hasPermission) {
				columnBoard.removeChild(cardToRemove.card);
			}
		});
	}

	async findBoard(userId: EntityId, boardId: EntityId): Promise<ColumnBoard> {
		this.logger.debug({ action: 'findBoard', userId, boardId });
		await this.pocCheckPermission(userId, boardId, [Permission.BOARD_READ]);

		const board = await this.columnBoardService.findById(boardId);
		// await this.checkPermission(userId, board, Action.read);
		await this.pocFilterColumnBoardChildrenByPermission(userId, board);

		return board;
	}

	async findBoardContext(userId: EntityId, boardId: EntityId): Promise<BoardExternalReference> {
		this.logger.debug({ action: 'findBoardContext', userId, boardId });

		await this.pocCheckPermission(userId, boardId, [Permission.BOARD_READ]);
		const board = await this.columnBoardService.findById(boardId);
		// await this.checkPermission(userId, board, Action.read);

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
}
