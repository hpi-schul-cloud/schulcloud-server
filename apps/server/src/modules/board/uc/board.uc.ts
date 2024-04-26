import { Action, AuthorizationService } from '@modules/authorization';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BoardExternalReference, Column, ColumnBoard } from '@shared/domain/domainobject';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { CopyStatus } from '@src/modules/copy-helper';
import { CreateBoardBodyParams } from '../controller/dto';
import { ColumnBoardService, ColumnService } from '../service';
import { BoardDoAuthorizableService } from '../service/board-do-authorizable.service';
import { ColumnBoardCopyService } from '../service/column-board-copy.service';
import { BaseUc } from './base.uc';

@Injectable()
export class BoardUc extends BaseUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		protected readonly authorizationService: AuthorizationService,
		protected readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly columnBoardCopyService: ColumnBoardCopyService,
		private readonly columnService: ColumnService,
		private readonly logger: LegacyLogger,
		private readonly courseRepo: CourseRepo
	) {
		super(authorizationService, boardDoAuthorizableService);
		this.logger.setContext(BoardUc.name);
	}

	async createBoard(userId: EntityId, params: CreateBoardBodyParams): Promise<ColumnBoard> {
		this.logger.debug({ action: 'createBoard', userId, title: params.title });

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const course = await this.courseRepo.findById(params.parentId);

		this.authorizationService.checkPermission(user, course, {
			action: Action.write,
			requiredPermissions: [Permission.COURSE_EDIT],
		});

		const context = { type: params.parentType, id: params.parentId };

		const board = await this.columnBoardService.create(context, params.layout, params.title);

		return board;
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

	async deleteBoard(userId: EntityId, boardId: EntityId): Promise<ColumnBoard> {
		this.logger.debug({ action: 'deleteBoard', userId, boardId });

		const board = await this.columnBoardService.findById(boardId);
		await this.checkPermission(userId, board, Action.write);

		await this.columnBoardService.delete(board);

		return board;
	}

	async updateBoardTitle(userId: EntityId, boardId: EntityId, title: string): Promise<ColumnBoard> {
		this.logger.debug({ action: 'updateBoardTitle', userId, boardId, title });

		const board = await this.columnBoardService.findById(boardId);
		await this.checkPermission(userId, board, Action.write);

		await this.columnBoardService.updateTitle(board, title);
		return board;
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
	): Promise<Column> {
		this.logger.debug({ action: 'moveColumn', userId, columnId, targetBoardId, targetPosition });

		const column = await this.columnService.findById(columnId);
		const targetBoard = await this.columnBoardService.findById(targetBoardId);

		await this.checkPermission(userId, column, Action.write);
		await this.checkPermission(userId, targetBoard, Action.write);

		await this.columnService.move(column, targetBoard, targetPosition);
		return column;
	}

	async copyBoard(userId: EntityId, boardId: EntityId): Promise<CopyStatus> {
		this.logger.debug({ action: 'copyBoard', userId, boardId });

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const board = await this.columnBoardService.findById(boardId);
		const course = await this.courseRepo.findById(board.context.id);

		await this.checkPermission(userId, board, Action.read);
		this.authorizationService.checkPermission(user, course, {
			action: Action.write,
			requiredPermissions: [],
		});

		const copyStatus = await this.columnBoardCopyService.copyColumnBoard({
			userId,
			originalColumnBoardId: boardId,
			destinationExternalReference: board.context,
		});

		return copyStatus;
	}

	async updateVisibility(userId: EntityId, boardId: EntityId, isVisible: boolean): Promise<void> {
		const board = await this.columnBoardService.findById(boardId);
		await this.checkPermission(userId, board, Action.write);

		await this.columnBoardService.updateBoardVisibility(board, isVisible);
	}
}
