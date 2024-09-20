import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RoomColor } from '../../../domain/type';

export class RoomItemResponse {
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
	untilDate?: Date;

	@ApiProperty({ type: Date })
	createdAt: Date;

	@ApiProperty({ type: Date })
	updatedAt: Date;

	constructor(room: RoomItemResponse) {
		this.id = room.id;
		this.name = room.name;
		this.color = room.color;

		this.startDate = room.startDate;
		this.untilDate = room.untilDate;
		this.createdAt = room.createdAt;
		this.updatedAt = room.updatedAt;
	}
}
