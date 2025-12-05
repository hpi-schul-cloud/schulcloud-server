import { ApiProperty } from '@nestjs/swagger';

export class RoomCreatedResponse {
	@ApiProperty()
	id: string;

	@ApiProperty({ type: Date })
	createdAt: Date;

	@ApiProperty({ type: Date })
	updatedAt: Date;

	constructor(room: RoomCreatedResponse) {
		this.id = room.id;
		this.createdAt = room.createdAt;
		this.updatedAt = room.updatedAt;
	}
}
