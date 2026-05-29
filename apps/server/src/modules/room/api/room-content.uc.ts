import { Action, AuthorizationService } from '@modules/authorization';
import { BoardNodeAuthorizableService, ColumnBoardService, type ColumnBoard } from '@modules/board';
import { BoardNodeRule, BoardOperation } from '@modules/board/authorisation/board-node.rule';
import { RoomMembershipService } from '@modules/room-membership';
import { RoomRule } from '@modules/room-membership/authorization/room.rule';
import { Injectable } from '@nestjs/common';
import { throwForbiddenIfFalse } from '@shared/common/utils/wrap-with-exception';
import { EntityId } from '@shared/domain/types';
import { RoomBoardService, RoomPermissionService } from './service';

@Injectable()
export class RoomContentUc {
	constructor(
		private readonly roomRule: RoomRule,
		private readonly boardNodeRule: BoardNodeRule,
		private readonly roomPermissionService: RoomPermissionService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly roomBoardService: RoomBoardService,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly authorizationService: AuthorizationService,
		private readonly columnBoardService: ColumnBoardService
	) {}

	public async getRoomBoards(
		userId: EntityId,
		roomId: EntityId
	): Promise<{ board: ColumnBoard; allowedOperations: Record<BoardOperation, boolean> }[]> {
		await this.roomPermissionService.checkRoomIsLocked(roomId);

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);

		throwForbiddenIfFalse(this.roomRule.can('accessRoomBoards', user, roomAuthorizable));

		const boards = await this.roomBoardService.getOrderedBoards(roomId);
		const authorizedBoards = await this.filterAuthorizedBoards(userId, boards);

		return authorizedBoards;
	}

	public async moveBoard(userId: EntityId, roomId: EntityId, boardId: EntityId, toPosition: number): Promise<void> {
		await this.roomPermissionService.checkRoomIsLocked(roomId);
		await this.roomPermissionService.checkRoomAuthorizationByIds(userId, roomId, Action.write);

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);
		const board = await this.columnBoardService.findById(boardId);
		const boardAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(board);

		const canFindBoard = this.boardNodeRule.can('findBoard', user, boardAuthorizable);
		const canEditContent = this.roomRule.can('editContent', user, roomAuthorizable);

		throwForbiddenIfFalse(canFindBoard && canEditContent);

		await this.roomBoardService.moveBoardInRoom(roomId, boardId, toPosition);
	}

	private async filterAuthorizedBoards(
		userId: EntityId,
		boards: ColumnBoard[]
	): Promise<{ board: ColumnBoard; allowedOperations: Record<BoardOperation, boolean> }[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardAuthorizables = await this.boardNodeAuthorizableService.getBoardAuthorizables(boards);

		const result: { board: ColumnBoard; allowedOperations: Record<BoardOperation, boolean> }[] = [];

		for (const board of boards) {
			const boardAuthorizable = boardAuthorizables.find((ba) => ba.boardNode.id === board.id);
			if (!boardAuthorizable) {
				continue;
			}
			if (this.boardNodeRule.can('findBoard', user, boardAuthorizable)) {
				const allowedOperations = this.boardNodeRule.listAllowedOperations(user, boardAuthorizable);
				result.push({ board, allowedOperations });
			}
		}

		return result;
	}
}
