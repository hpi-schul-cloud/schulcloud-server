import { Page } from '@shared/domain/domainobject';
import { ColumnBoard } from '@src/modules/board';
import { Room } from '../../domain/do/room.do';
import { RoomPaginationParams } from '../dto/request/room-pagination.params';
import { RoomContentItemResponse, RoomContentItemType } from '../dto/response/room-content-item.response';
import { RoomContentResponse } from '../dto/response/room-content.response';
import { RoomDetailsResponse } from '../dto/response/room-details.response';
import { RoomItemResponse } from '../dto/response/room-item.response';
import { RoomListResponse } from '../dto/response/room-list.response';

export class RoomMapper {
	static mapToRoomItemResponse(room: Room): RoomItemResponse {
		const response = new RoomItemResponse({
			id: room.id,
			name: room.name,
			color: room.color,
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

	static mapToRoomDetailsResponse(room: Room): RoomDetailsResponse {
		const response = new RoomDetailsResponse({
			id: room.id,
			name: room.name,
			color: room.color,
			startDate: room.startDate,
			endDate: room.endDate,
			createdAt: room.createdAt,
			updatedAt: room.updatedAt,
		});

		return response;
	}

	static mapToRoomContentItemReponse(board: ColumnBoard): RoomContentItemResponse {
		const response = new RoomContentItemResponse({
			type: RoomContentItemType.COLUMN_BOARD,
			id: board.id,
			name: board.title,
			createdAt: board.createdAt,
			updatedAt: board.updatedAt,
		});

		return response;
	}

	static mapToRoomContentResponse(columnBoards: ColumnBoard[]): RoomContentResponse {
		const itemData = columnBoards.map((board) => this.mapToRoomContentItemReponse(board));

		const response = new RoomContentResponse(itemData, columnBoards.length);

		return response;
	}
}
