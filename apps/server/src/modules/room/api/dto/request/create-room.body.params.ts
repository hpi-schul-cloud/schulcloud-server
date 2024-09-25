import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller';
import { RoomCreateProps } from '@src/modules/room/domain';
import { RoomColor } from '@src/modules/room/domain/type';
import { IsDate, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRoomBodyParams implements RoomCreateProps {
	@ApiProperty({
		description: 'The name of the room',
		required: true,
	})
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	@SanitizeHtml()
	name!: string;

	@ApiProperty({
		description: 'The display color of the room',
		enum: RoomColor,
		enumName: 'RoomColor',
	})
	@IsEnum(RoomColor)
	color!: RoomColor;

	@IsDate()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'Start date of the room',
		required: false,
		type: Date,
	})
	startDate?: Date;

	@IsDate()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'End date of the room',
		required: false,
		type: Date,
	})
	endDate?: Date;
}
