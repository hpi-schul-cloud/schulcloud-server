import { ColumnBoard } from '@modules/board';
import { Page } from '@shared/domain/domainobject';
import { Permission } from '@shared/domain/interface';
import { Room } from '../../domain/do/room.do';
import { RoomPaginationParams } from '../dto/request/room-pagination.params';
import { RoomBoardItemResponse } from '../dto/response/room-board-item.response';
import { RoomBoardListResponse } from '../dto/response/room-board-list.response';
import { RoomDetailsResponse } from '../dto/response/room-details.response';
import { RoomItemResponse } from '../dto/response/room-item.response';
import { RoomListResponse } from '../dto/response/room-list.response';
import { PaginationParams } from '@shared/controller/dto';
import { RoomStatsListResponse } from '../dto/response/room-stats-list.repsonse';
import { RoomStatsItemResponse } from '../dto/response/room-stats-item.response';
import { RoomStats } from '../type/room-stats.type';

export class RoomMapper {
	static mapToRoomItemResponse(room: Room): RoomItemResponse {
		const response = new RoomItemResponse({
			id: room.id,
			name: room.name,
			color: room.color,
			schoolId: room.schoolId,
			startDate: room.startDate,
			endDate: room.endDate,
			createdAt: room.createdAt,
			updatedAt: room.updatedAt,
		});

		return response;
	}

	static mapToRoomListResponse(rooms: Page<Room>, pagination: RoomPaginationParams): RoomListResponse {
		const roomResponseData: RoomItemResponse[] = rooms.data.map(
			(room): RoomItemResponse => this.mapToRoomItemResponse(room)
		);
		const response = new RoomListResponse(roomResponseData, rooms.total, pagination.skip, pagination.limit);

		return response;
	}

	static mapToRoomDetailsResponse(room: Room, permissions: Permission[]): RoomDetailsResponse {
		const response = new RoomDetailsResponse({
			id: room.id,
			name: room.name,
			color: room.color,
			schoolId: room.schoolId,
			startDate: room.startDate,
			endDate: room.endDate,
			createdAt: room.createdAt,
			updatedAt: room.updatedAt,
			permissions,
			features: room.features,
		});

		return response;
	}

	static mapToRoomBoardItemReponse(board: ColumnBoard): RoomBoardItemResponse {
		const response = new RoomBoardItemResponse({
			id: board.id,
			title: board.title,
			layout: board.layout,
			isVisible: board.isVisible,
			createdAt: board.createdAt,
			updatedAt: board.updatedAt,
		});

		return response;
	}

	static mapToRoomBoardListResponse(columnBoards: ColumnBoard[]): RoomBoardListResponse {
		const itemData = columnBoards.map((board) => this.mapToRoomBoardItemReponse(board));

		const response = new RoomBoardListResponse(itemData, columnBoards.length);

		return response;
	}

	public static mapToRoomStatsListResponse(
		roomStats: Page<RoomStats>,
		pagination: PaginationParams
	): RoomStatsListResponse {
		const roomStatsResponseData: RoomStatsItemResponse[] = roomStats.data.map((item) => {
			return {
				...item,
				roomName: item.name,
				createdAt: item.createdAt,
				updatedAt: item.updatedAt,
			};
		});
		const response = new RoomStatsListResponse(
			roomStatsResponseData,
			roomStats.total,
			pagination.skip,
			pagination.limit
		);

		return response;
	}
}
