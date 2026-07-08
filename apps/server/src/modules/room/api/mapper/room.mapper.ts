import { type ColumnBoard } from '@modules/board';
import { type BoardOperation } from '@modules/board/authorisation/board-node.rule';
import { type RoomOperation } from '@modules/room-membership/authorization/room.rule';
import { type PaginationParams } from '@shared/controller/dto';
import { type Page } from '@shared/domain/domainobject';
import { type Room } from '../../domain/do/room.do';
import { RoomBoardItemResponse } from '../dto/response/room-board-item.response';
import { RoomBoardListResponse } from '../dto/response/room-board-list.response';
import { RoomCreatedResponse } from '../dto/response/room-created.response';
import { RoomDetailsResponse } from '../dto/response/room-details.response';
import { RoomItemResponse } from '../dto/response/room-item.response';
import { RoomListResponse } from '../dto/response/room-list.response';
import { RoomStatsItemResponse } from '../dto/response/room-stats-item.response';
import { RoomStatsListResponse } from '../dto/response/room-stats-list.repsonse';
import { type RoomStats } from '../type/room-stats.type';
import { type RoomWithAllowedOperationsAndLockedStatus } from '../type/room-with-locked-status';

export class RoomMapper {
	public static mapToRoomCreatedResponse(room: Room): RoomCreatedResponse {
		const response = new RoomCreatedResponse({
			id: room.id,
			createdAt: room.createdAt,
			updatedAt: room.updatedAt,
		});

		return response;
	}

	public static mapToRoomItemResponse({
		room,
		allowedOperations,
		isLocked,
		totalMembers,
	}: RoomWithAllowedOperationsAndLockedStatus): RoomItemResponse {
		const response = new RoomItemResponse({
			id: room.id,
			name: room.name,
			color: room.color,
			schoolId: room.schoolId,
			startDate: room.startDate,
			endDate: room.endDate,
			createdAt: room.createdAt,
			updatedAt: room.updatedAt,
			allowedOperations,
			isLocked,
			totalMembers,
		});

		return response;
	}

	public static mapToRoomListResponse(rooms: RoomWithAllowedOperationsAndLockedStatus[]): RoomListResponse {
		const roomResponseData: RoomItemResponse[] = rooms.map(
			(room): RoomItemResponse => this.mapToRoomItemResponse(room)
		);
		const response = new RoomListResponse(roomResponseData);

		return response;
	}

	public static mapToRoomDetailsResponse(
		room: Room,
		allowedOperations: Record<RoomOperation, boolean>
	): RoomDetailsResponse {
		const response = new RoomDetailsResponse({
			id: room.id,
			name: room.name,
			color: room.color,
			schoolId: room.schoolId,
			startDate: room.startDate,
			endDate: room.endDate,
			createdAt: room.createdAt,
			updatedAt: room.updatedAt,
			allowedOperations,
			features: room.features,
		});

		return response;
	}

	public static mapToRoomBoardItemReponse(
		board: ColumnBoard,
		allowedOperations: Partial<Record<BoardOperation, boolean>>
	): RoomBoardItemResponse {
		const response = new RoomBoardItemResponse({
			id: board.id,
			title: board.title,
			layout: board.layout,
			isVisible: board.isVisible,
			createdAt: board.createdAt,
			updatedAt: board.updatedAt,
			allowedOperations: Object.fromEntries(Object.entries(allowedOperations).filter(([, value]) => value)),
		});

		return response;
	}

	public static mapToRoomBoardListResponse(
		boardsWithOperations: { board: ColumnBoard; allowedOperations: Record<BoardOperation, boolean> }[]
	): RoomBoardListResponse {
		const itemData = boardsWithOperations.map(({ board, allowedOperations }) =>
			this.mapToRoomBoardItemReponse(board, allowedOperations)
		);

		const response = new RoomBoardListResponse(itemData, boardsWithOperations.length);

		return response;
	}

	public static mapToRoomStatsListResponse(
		roomStats: Page<RoomStats>,
		pagination: PaginationParams
	): RoomStatsListResponse {
		const roomStatsResponseData: RoomStatsItemResponse[] = roomStats.data.map(
			(item) =>
				new RoomStatsItemResponse({
					...item,
					name: item.name,
					createdAt: item.createdAt,
					updatedAt: item.updatedAt,
				})
		);
		const response = new RoomStatsListResponse(
			roomStatsResponseData,
			roomStats.total,
			pagination.skip,
			pagination.limit
		);

		return response;
	}
}
