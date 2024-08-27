import { Page } from '@shared/domain/domainobject';
import { RoomPaginationParams } from '../dto/response/room-pagination.params';
import { RoomListResponse } from '../dto/response/room-list.response';
import { Room } from '../../domain/do/room.do';

export class RoomMapper {
	static mapToRoomListResponse(rooms: Page<Room>, pagination: RoomPaginationParams): RoomListResponse {
		const response = new RoomListResponse(rooms.data, rooms.total, pagination.skip, pagination.limit);

		return response;
	}
}
