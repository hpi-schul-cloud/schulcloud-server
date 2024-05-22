import { Action, AuthorizationService } from '@modules/authorization';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { CopyStatus } from '@modules/copy-helper';
import { CreateBoardBodyParams } from '../controller/dto';
import { BoardExternalReference, BoardNodeFactory, Column, ColumnBoard } from '../domain';
import { BoardNodePermissionService, BoardNodeService, ColumnBoardCopyService } from '../service';

@Injectable()
export class BoardUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService)) // TODO is this needed?
		private readonly authorizationService: AuthorizationService,
		private readonly boardPermissionService: BoardNodePermissionService,
		private readonly boardNodeService: BoardNodeService,
		private readonly columnBoardCopyService: ColumnBoardCopyService,
		private readonly logger: LegacyLogger,
		private readonly courseRepo: CourseRepo,
		private readonly boardNodeFactory: BoardNodeFactory
	) {
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

		const board = this.boardNodeFactory.buildColumnBoard({
			context: { type: params.parentType, id: params.parentId },
			title: params.title,
			layout: params.layout,
		});

		await this.boardNodeService.addRoot(board);

		return board;
	}

	async findBoard(userId: EntityId, boardId: EntityId): Promise<ColumnBoard> {
		this.logger.debug({ action: 'findBoard', userId, boardId });

		// TODO set depth=2 to reduce data?
		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);
		await this.boardPermissionService.checkPermission(userId, board, Action.read);

		return board;
	}

	async findBoardContext(userId: EntityId, boardId: EntityId): Promise<BoardExternalReference> {
		this.logger.debug({ action: 'findBoardContext', userId, boardId });

		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);
		await this.boardPermissionService.checkPermission(userId, board, Action.read);

		return board.context;
	}

	async deleteBoard(userId: EntityId, boardId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteBoard', userId, boardId });

		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);
		await this.boardPermissionService.checkPermission(userId, board, Action.write);

		await this.boardNodeService.delete(board);
	}

	async updateBoardTitle(userId: EntityId, boardId: EntityId, title: string): Promise<void> {
		this.logger.debug({ action: 'updateBoardTitle', userId, boardId, title });

		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);
		await this.boardPermissionService.checkPermission(userId, board, Action.write);

		await this.boardNodeService.updateTitle(board, title);
	}

	async createColumn(userId: EntityId, boardId: EntityId): Promise<Column> {
		this.logger.debug({ action: 'createColumn', userId, boardId });

		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);
		await this.boardPermissionService.checkPermission(userId, board, Action.write);

		const column = this.boardNodeFactory.buildColumn();

		await this.boardNodeService.addToParent(board, column);

		return column;
	}

	async moveColumn(
		userId: EntityId,
		columnId: EntityId,
		targetBoardId: EntityId,
		targetPosition: number
	): Promise<void> {
		this.logger.debug({ action: 'moveColumn', userId, columnId, targetBoardId, targetPosition });

		const column = await this.boardNodeService.findByClassAndId(Column, columnId);
		const targetBoard = await this.boardNodeService.findByClassAndId(ColumnBoard, targetBoardId);

		await this.boardPermissionService.checkPermission(userId, column, Action.write);
		await this.boardPermissionService.checkPermission(userId, targetBoard, Action.write);

		await this.boardNodeService.move(column, targetBoard, targetPosition);
	}

	async copyBoard(userId: EntityId, boardId: EntityId): Promise<CopyStatus> {
		this.logger.debug({ action: 'copyBoard', userId, boardId });

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);

		// TODO - should not use course repo
		const course = await this.courseRepo.findById(board.context.id);

		await this.boardPermissionService.checkPermission(userId, board, Action.read);
		this.authorizationService.checkPermission(user, course, {
			action: Action.write,
			requiredPermissions: [], // TODO - what permissions are required? COURSE_EDIT?
		});

		const copyStatus = await this.columnBoardCopyService.copyColumnBoard({
			userId,
			originalColumnBoardId: boardId,
			destinationExternalReference: board.context,
		});

		return copyStatus;
	}

	async updateVisibility(userId: EntityId, boardId: EntityId, isVisible: boolean): Promise<void> {
		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);
		await this.boardPermissionService.checkPermission(userId, board, Action.write);

		await this.boardNodeService.updateVisibility(board, isVisible);
	}
}
