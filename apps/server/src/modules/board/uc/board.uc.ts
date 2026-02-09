import { LegacyLogger } from '@core/logger';
import { StorageLocation } from '@infra/files-storage-client';
import { Action, AuthorizationService } from '@modules/authorization';
import { BoardContextApiHelperService } from '@modules/board-context';
import { CopyStatus } from '@modules/copy-helper';
import { CourseService } from '@modules/course';
import { RoomService } from '@modules/room';
import { RoomMembershipService } from '@modules/room-membership';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { throwForbiddenIfFalse } from '@shared/common/utils';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { BoardNodeRule } from '../authorisation/board-node.rule';
import { BoardConfig } from '../board.config';
import { CreateBoardBodyParams } from '../controller/dto';
import {
	BoardExternalReference,
	BoardExternalReferenceType,
	BoardFeature,
	BoardLayout,
	BoardNodeFactory,
	Column,
	ColumnBoard,
} from '../domain';
import { BoardNodeAuthorizableService, BoardNodeService, ColumnBoardService } from '../service';
import { StorageLocationReference } from '../service/internal';

@Injectable()
export class BoardUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService)) // TODO is this needed?
		private readonly authorizationService: AuthorizationService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly boardNodeService: BoardNodeService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly logger: LegacyLogger,
		private readonly courseService: CourseService,
		private readonly roomService: RoomService,
		private readonly boardNodeFactory: BoardNodeFactory,
		private readonly boardContextApiHelperService: BoardContextApiHelperService,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly configService: ConfigService<BoardConfig, true>,
		private readonly boardNodeRule: BoardNodeRule
	) {
		this.logger.setContext(BoardUc.name);
	}

	public async createBoard(userId: EntityId, params: CreateBoardBodyParams): Promise<ColumnBoard> {
		await this.checkBoardCreatePermission(userId, { type: params.parentType, id: params.parentId });

		const board = this.boardNodeFactory.buildColumnBoard({
			context: { type: params.parentType, id: params.parentId },
			title: params.title,
			layout: params.layout,
		});

		await this.boardNodeService.addRoot(board);

		return board;
	}

	public async findBoard(
		userId: EntityId,
		boardId: EntityId
	): Promise<{ board: ColumnBoard; features: BoardFeature[]; permissions: Permission[] }> {
		// TODO set depth=2 to reduce data?
		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(board);
		const user = await this.authorizationService.getUserWithPermissions(userId);

		throwForbiddenIfFalse(this.boardNodeRule.canFindBoard(user, boardNodeAuthorizable));

		const features = await this.boardContextApiHelperService.getFeaturesForBoardNode(boardId);
		const permissions = boardNodeAuthorizable.getUserPermissions(userId);
		return { board, features, permissions };
	}

	public async findBoardContext(userId: EntityId, boardId: EntityId): Promise<BoardExternalReference> {
		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(board);
		const user = await this.authorizationService.getUserWithPermissions(userId);

		throwForbiddenIfFalse(this.boardNodeRule.canFindBoard(user, boardNodeAuthorizable));

		return board.context;
	}

	public async deleteBoard(userId: EntityId, boardId: EntityId): Promise<ColumnBoard> {
		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId); // TODO decide to refactor returned object vs return boardNodeId
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(board);
		const user = await this.authorizationService.getUserWithPermissions(userId);

		throwForbiddenIfFalse(this.boardNodeRule.canDeleteBoard(user, boardNodeAuthorizable));

		await this.boardNodeService.delete(board);
		return board;
	}

	public async updateBoardTitle(userId: EntityId, boardId: EntityId, title: string): Promise<ColumnBoard> {
		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId); // TODO decide to refactor returned object vs return boardNodeId
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(board);
		const user = await this.authorizationService.getUserWithPermissions(userId);

		throwForbiddenIfFalse(this.boardNodeRule.canUpdateBoardTitle(user, boardNodeAuthorizable));

		await this.boardNodeService.updateTitle(board, title);
		return board;
	}

	public async createColumn(userId: EntityId, boardId: EntityId): Promise<Column> {
		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId, 1);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(board);
		const user = await this.authorizationService.getUserWithPermissions(userId);

		throwForbiddenIfFalse(this.boardNodeRule.canCreateColumn(user, boardNodeAuthorizable));

		const column = this.boardNodeFactory.buildColumn();

		await this.boardNodeService.addToParent(board, column);

		return column;
	}

	public async moveColumn(
		userId: EntityId,
		columnId: EntityId,
		targetBoardId: EntityId,
		targetPosition: number
	): Promise<Column> {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		const column = await this.boardNodeService.findByClassAndId(Column, columnId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(column);

		throwForbiddenIfFalse(this.boardNodeRule.canMoveColumn(user, boardNodeAuthorizable));

		const targetBoard = await this.boardNodeService.findByClassAndId(ColumnBoard, targetBoardId);
		const boardNodeAuthorizableTargetBoard = await this.boardNodeAuthorizableService.getBoardAuthorizable(targetBoard);

		throwForbiddenIfFalse(this.boardNodeRule.canMoveColumn(user, boardNodeAuthorizableTargetBoard));

		await this.boardNodeService.move(column, targetBoard, targetPosition);
		return column;
	}

	public async copyBoard(userId: EntityId, boardId: EntityId, targetSchoolId: EntityId): Promise<CopyStatus> {
		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(board);

		throwForbiddenIfFalse(this.boardNodeRule.canCopyBoard(user, boardNodeAuthorizable));

		const sourceStorageLocationReference = await this.getStorageLocationReference(board.context);
		const targetStorageLocationReference = { id: targetSchoolId, type: StorageLocation.SCHOOL };

		const copyStatus = await this.columnBoardService.copyColumnBoard({
			originalColumnBoardId: boardId,
			targetExternalReference: board.context,
			sourceStorageLocationReference,
			targetStorageLocationReference,
			userId,
			targetSchoolId,
		});

		await this.columnBoardService.swapLinkedIdsInBoards(copyStatus);

		return copyStatus;
	}

	public async updateVisibility(userId: EntityId, boardId: EntityId, isVisible: boolean): Promise<ColumnBoard> {
		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(board);

		throwForbiddenIfFalse(this.boardNodeRule.canUpdateBoardVisibility(user, boardNodeAuthorizable));

		await this.boardNodeService.updateVisibility(board, isVisible);

		return board;
	}

	public async updateReadersCanEdit(
		userId: EntityId,
		boardId: EntityId,
		readersCanEdit: boolean
	): Promise<ColumnBoard> {
		if (!this.configService.get('FEATURE_BOARD_READERS_CAN_EDIT_TOGGLE', { infer: true })) {
			throw new FeatureDisabledLoggableException('FEATURE_BOARD_READERS_CAN_EDIT_TOGGLE');
		}

		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(board);

		throwForbiddenIfFalse(this.boardNodeRule.canUpdateReadersCanEditSetting(user, boardNodeAuthorizable));

		await this.columnBoardService.updateReadersCanEdit(board, readersCanEdit);
		return board;
	}

	public async updateLayout(userId: EntityId, boardId: EntityId, layout: BoardLayout): Promise<ColumnBoard> {
		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(board);

		throwForbiddenIfFalse(this.boardNodeRule.canUpdateBoardLayout(user, boardNodeAuthorizable));

		await this.boardNodeService.updateLayout(board, layout);
		return board;
	}

	private async checkBoardCreatePermission(userId: EntityId, context: BoardExternalReference): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		if (context.type === BoardExternalReferenceType.Course) {
			const course = await this.courseService.findById(context.id);

			this.authorizationService.checkPermission(user, course, {
				action: Action.write,
				requiredPermissions: [Permission.COURSE_EDIT],
			});
		} else if (context.type === BoardExternalReferenceType.Room) {
			const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(context.id);

			this.authorizationService.checkPermission(user, roomAuthorizable, {
				action: Action.write,
				requiredPermissions: [Permission.ROOM_EDIT_CONTENT],
			});
		} else {
			throw new Error(`Unsupported context type ${context.type as string}`);
		}
	}

	private async getStorageLocationReference(context: BoardExternalReference): Promise<StorageLocationReference> {
		if (context.type === BoardExternalReferenceType.Course) {
			const course = await this.courseService.findById(context.id);

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
