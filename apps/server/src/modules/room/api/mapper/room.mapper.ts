import { Page } from '@shared/domain/domainobject';
import { RoomPaginationParams } from '../dto/request/room-pagination.params';
import { RoomResponse, RoomListResponse } from '../dto';
import { Room } from '../../domain/do/room.do';

export class RoomMapper {
	static mapToRoomResponse(room: Room): RoomResponse {
		const response = new RoomResponse({
			id: room.id,
			name: room.name,
			color: room.color,
			startDate: room.startDate,
			untilDate: room.untilDate,
		});

		return response;
	}

	static mapToRoomListResponse(rooms: Page<Room>, pagination: RoomPaginationParams): RoomListResponse {
		const roomResponseData: RoomResponse[] = rooms.data.map((room): RoomResponse => this.mapToRoomResponse(room));
		const response = new RoomListResponse(roomResponseData, rooms.total, pagination.skip, pagination.limit);

		return response;
	}
}
