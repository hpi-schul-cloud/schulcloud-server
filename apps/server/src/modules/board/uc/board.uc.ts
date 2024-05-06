import { Action, AuthorizationService } from '@modules/authorization';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BoardExternalReference } from '@shared/domain/domainobject';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { CopyStatus } from '@src/modules/copy-helper';
import { ObjectId } from '@mikro-orm/mongodb';
import { CreateBoardBodyParams } from '../controller/dto';
import { ColumnBoardCopyService } from '../service/column-board-copy.service';
import { BoardNodeService, BoardNodePermissionService } from '../poc/service';
import { BoardNodeRepo } from '../poc/repo';
import { ColumnBoard, Column } from '../poc/domain';

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
		private readonly boardNodeRepo: BoardNodeRepo
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

		const context: BoardExternalReference = { type: params.parentType, id: params.parentId };

		const board = new ColumnBoard({
			id: new ObjectId().toHexString(),
			path: '',
			level: 0,
			position: 0,
			title: params.title,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			context,
			isVisible: false,
			layout: params.layout,
		});

		this.boardNodeRepo.persist(board);
		await this.boardNodeRepo.flush();

		return board;
	}

	async findBoard(userId: EntityId, boardId: EntityId): Promise<ColumnBoard> {
		this.logger.debug({ action: 'findBoard', userId, boardId });

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

		await this.boardNodeRepo.removeAndFlush(board);
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

		const column = new Column({
			id: new ObjectId().toHexString(),
			path: '',
			level: 1,
			position: 0,
			title: '',
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		this.boardNodeRepo.persist(column);

		board.addChild(column);
		await this.boardNodeRepo.persistAndFlush(board);

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

		const course = await this.courseRepo.findById(board.context.id);

		await this.boardPermissionService.checkPermission(userId, board, Action.read);
		this.authorizationService.checkPermission(user, course, {
			action: Action.write,
			requiredPermissions: [],
		});

		// TODO: implement copyColumnBoard
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
