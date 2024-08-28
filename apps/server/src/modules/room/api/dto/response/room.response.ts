import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoomResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	color: string;

	@ApiPropertyOptional({ type: Date })
	startDate?: Date;

	@ApiPropertyOptional({ type: Date })
	untilDate?: Date;

	constructor(room: RoomResponse) {
		this.id = room.id;
		this.name = room.name;
		this.color = room.color;

		this.startDate = room.startDate;
		this.untilDate = room.untilDate;
	}
}
