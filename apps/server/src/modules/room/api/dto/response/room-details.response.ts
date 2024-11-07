import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomColor } from '@src/modules/room/domain/type';
import { IsEnum } from 'class-validator';

export class RoomDetailsResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty({ enum: RoomColor, enumName: 'RoomColor' })
	@IsEnum(RoomColor)
	color: RoomColor;

	@ApiPropertyOptional({ type: Date })
	startDate?: Date;

	@ApiPropertyOptional({ type: Date })
	endDate?: Date;

	@ApiProperty({ type: Date })
	createdAt: Date;

	@ApiProperty({ type: Date })
	updatedAt: Date;

	constructor(room: RoomDetailsResponse) {
		this.id = room.id;
		this.name = room.name;
		this.color = room.color;

		this.startDate = room.startDate;
		this.endDate = room.endDate;
		this.createdAt = room.createdAt;
		this.updatedAt = room.updatedAt;
	}
}
