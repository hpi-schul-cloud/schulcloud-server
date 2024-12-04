import { Action, AuthorizationService } from '@modules/authorization';
import { CopyStatus } from '@modules/copy-helper';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo/course';
import { LegacyLogger } from '@src/core/logger';
import { StorageLocation } from '@src/modules/files-storage/interface';
import { RoomService } from '@src/modules/room';
import { RoomMembershipService } from '@src/modules/room-membership';
import { CreateBoardBodyParams } from '../controller/dto';
import { BoardExternalReference, BoardExternalReferenceType, BoardNodeFactory, Column, ColumnBoard } from '../domain';
import { BoardNodePermissionService, BoardNodeService, ColumnBoardService } from '../service';
import { StorageLocationReference } from '../service/internal';

@Injectable()
export class BoardUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService)) // TODO is this needed?
		private readonly authorizationService: AuthorizationService,
		private readonly boardPermissionService: BoardNodePermissionService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly boardNodeService: BoardNodeService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly logger: LegacyLogger,
		private readonly courseRepo: CourseRepo,
		private readonly roomService: RoomService,
		private readonly boardNodeFactory: BoardNodeFactory
	) {
		this.logger.setContext(BoardUc.name);
	}

	async createBoard(userId: EntityId, params: CreateBoardBodyParams): Promise<ColumnBoard> {
		this.logger.debug({ action: 'createBoard', userId, title: params.title });

		await this.checkReferenceWritePermission(userId, { type: params.parentType, id: params.parentId });

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

	async deleteBoard(userId: EntityId, boardId: EntityId): Promise<ColumnBoard> {
		this.logger.debug({ action: 'deleteBoard', userId, boardId });

		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);
		await this.boardPermissionService.checkPermission(userId, board, Action.write);

		await this.boardNodeService.delete(board);
		return board;
	}

	async updateBoardTitle(userId: EntityId, boardId: EntityId, title: string): Promise<ColumnBoard> {
		this.logger.debug({ action: 'updateBoardTitle', userId, boardId, title });

		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);
		await this.boardPermissionService.checkPermission(userId, board, Action.write);

		await this.boardNodeService.updateTitle(board, title);
		return board;
	}

	async createColumn(userId: EntityId, boardId: EntityId): Promise<Column> {
		this.logger.debug({ action: 'createColumn', userId, boardId });

		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId, 1);
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
	): Promise<Column> {
		this.logger.debug({ action: 'moveColumn', userId, columnId, targetBoardId, targetPosition });

		const column = await this.boardNodeService.findByClassAndId(Column, columnId);
		const targetBoard = await this.boardNodeService.findByClassAndId(ColumnBoard, targetBoardId);

		await this.boardPermissionService.checkPermission(userId, column, Action.write);
		await this.boardPermissionService.checkPermission(userId, targetBoard, Action.write);

		await this.boardNodeService.move(column, targetBoard, targetPosition);
		return column;
	}

	async copyBoard(userId: EntityId, boardId: EntityId): Promise<CopyStatus> {
		this.logger.debug({ action: 'copyBoard', userId, boardId });

		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);

		await this.boardPermissionService.checkPermission(userId, board, Action.read);
		await this.checkReferenceWritePermission(userId, board.context);

		const storageLocationReference = await this.getStorageLocationReference(board.context);

		const copyStatus = await this.columnBoardService.copyColumnBoard({
			originalColumnBoardId: boardId,
			targetExternalReference: board.context,
			sourceStorageLocationReference: storageLocationReference,
			targetStorageLocationReference: storageLocationReference,
			userId,
		});

		return copyStatus;
	}

	async updateVisibility(userId: EntityId, boardId: EntityId, isVisible: boolean): Promise<ColumnBoard> {
		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);
		await this.boardPermissionService.checkPermission(userId, board, Action.write);

		await this.boardNodeService.updateVisibility(board, isVisible);
		return board;
	}

	// ---- Move to shared service? (see apps/server/src/modules/sharing/uc/share-token.uc.ts)

	private async checkReferenceWritePermission(userId: EntityId, context: BoardExternalReference) {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		if (context.type === BoardExternalReferenceType.Course) {
			const course = await this.courseRepo.findById(context.id);

			this.authorizationService.checkPermission(user, course, {
				action: Action.write,
				requiredPermissions: [Permission.COURSE_EDIT],
			});
		} else if (context.type === BoardExternalReferenceType.Room) {
			const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(context.id);

			this.authorizationService.checkPermission(user, roomMembershipAuthorizable, {
				action: Action.write,
				requiredPermissions: [],
			});
		} else {
			throw new Error(`Unsupported context type ${context.type as string}`);
		}
	}

	private async getStorageLocationReference(context: BoardExternalReference): Promise<StorageLocationReference> {
		if (context.type === BoardExternalReferenceType.Course) {
			const course = await this.courseRepo.findById(context.id);

			return { id: course.school.id, type: StorageLocation.SCHOOL };
		}

		if (context.type === BoardExternalReferenceType.Room) {
			const room = await this.roomService.getSingleRoom(context.id);

			return { id: room.schoolId, type: StorageLocation.SCHOOL };
		}
		/* istanbul ignore next */
		throw new Error(`Unsupported board reference type ${context.type as string}`);
	}
}
