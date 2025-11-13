import { Injectable } from '@nestjs/common';
import { RoomService } from '../domain';
import { RoomBoardService, RoomPermissionService } from './service';
import { EntityId } from '@shared/domain/types';
import { Action, AuthorizationService } from '@modules/authorization';
import { BoardNodeAuthorizableService, ColumnBoardService, type ColumnBoard } from '@modules/board';

@Injectable()
export class RoomContentUc {
	constructor(
		private readonly roomService: RoomService,
		private readonly roomPermissionService: RoomPermissionService,
		private readonly roomBoardService: RoomBoardService,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly authorizationService: AuthorizationService,
		private readonly columnBoardService: ColumnBoardService
	) {}

	public async getRoomBoards(userId: EntityId, roomId: EntityId): Promise<ColumnBoard[]> {
		await this.roomService.getSingleRoom(roomId);
		await this.roomPermissionService.checkRoomIsUnlocked(roomId);
		await this.roomPermissionService.checkRoomAuthorizationByIds(userId, roomId, Action.read);

		const boards = await this.roomBoardService.getOrderedBoards(roomId);
		const authorizedBoards = await this.filterAuthorizedBoards(userId, boards);

		return authorizedBoards;
	}

	public async moveBoard(userId: EntityId, roomId: EntityId, boardId: EntityId, toPosition: number): Promise<void> {
		await this.roomService.getSingleRoom(roomId);
		await this.roomPermissionService.checkRoomIsUnlocked(roomId);
		await this.roomPermissionService.checkRoomAuthorizationByIds(userId, roomId, Action.write);

		const board = await this.columnBoardService.findById(boardId);

		await this.checkBoardAuthorization(userId, board);

		await this.roomBoardService.moveBoardInRoom(roomId, boardId, toPosition);
	}

	private async filterAuthorizedBoards(userId: EntityId, boards: ColumnBoard[]): Promise<ColumnBoard[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		const context = { action: Action.read, requiredPermissions: [] };
		const boardAuthorizables = await this.boardNodeAuthorizableService.getBoardAuthorizables(boards);

		const allowedBoards = boardAuthorizables.reduce((allowedNodes: ColumnBoard[], boardNodeAuthorizable) => {
			if (this.authorizationService.hasPermission(user, boardNodeAuthorizable, context)) {
				allowedNodes.push(boardNodeAuthorizable.boardNode as ColumnBoard);
			}
			return allowedNodes;
		}, []);

		return allowedBoards;
	}

	private async checkBoardAuthorization(userId: EntityId, board: ColumnBoard): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const context = { action: Action.read, requiredPermissions: [] };

		const boardAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(board);

		this.authorizationService.checkPermission(user, boardAuthorizable, context);
	}
}
