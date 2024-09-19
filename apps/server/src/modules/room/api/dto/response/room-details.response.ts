import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoomDetailsResponse {
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

	@ApiPropertyOptional({ type: Date })
	createdAt?: Date;

	@ApiPropertyOptional({ type: Date })
	updatedAt?: Date;

	constructor(room: RoomDetailsResponse) {
		this.id = room.id;
		this.name = room.name;
		this.color = room.color;

		this.startDate = room.startDate;
		this.untilDate = room.untilDate;
		this.createdAt = room.createdAt;
		this.updatedAt = room.updatedAt;
	}
}
