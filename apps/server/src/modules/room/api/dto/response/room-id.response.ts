import { ApiProperty } from '@nestjs/swagger';

export class RoomIdResponse {
	@ApiProperty()
	id: string;

	constructor(room: RoomIdResponse) {
		this.id = room.id;
	}
}
