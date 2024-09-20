import { Page } from '@shared/domain/domainobject';
import { RoomPaginationParams } from '../dto/request/room-pagination.params';
import { RoomItemResponse, RoomListResponse, RoomDetailsResponse } from '../dto';
import { Room } from '../../domain/do/room.do';

export class RoomMapper {
	static mapToRoomResponse(room: Room): RoomItemResponse {
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
			(room): RoomItemResponse => this.mapToRoomResponse(room)
		);
		const response = new RoomListResponse(roomResponseData, rooms.total, pagination.skip, pagination.limit);

		return response;
	}

	static mapToRoomDetailsResponse(room: Room): RoomDetailsResponse {
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
}
