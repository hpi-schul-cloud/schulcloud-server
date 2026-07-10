import { ApiProperty } from '@nestjs/swagger';

export class TeamCreateRoomResponse {
	@ApiProperty({ description: 'The id of the exported room.' })
	roomId: string;

	constructor(roomId: string) {
		this.roomId = roomId;
	}
}
