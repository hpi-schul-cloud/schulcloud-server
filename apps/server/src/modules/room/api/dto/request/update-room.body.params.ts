import { RoomUpdateProps } from '@modules/room/domain';
import { RoomColor, RoomFeatures } from '@modules/room/domain/type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NullToUndefined, SanitizeHtml } from '@shared/controller/transformer';
import { IsDate, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateRoomBodyParams implements RoomUpdateProps {
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
	@NullToUndefined()
	@ApiPropertyOptional({
		description: 'Start date of the room',
		required: false,
		type: Date,
	})
	startDate?: Date;

	@IsDate()
	@IsOptional()
	@NullToUndefined()
	@ApiPropertyOptional({
		description: 'Start date of the room',
		required: false,
		type: Date,
	})
	endDate?: Date;

	@ApiProperty({
		description: 'The features of the room',
		enum: RoomFeatures,
		enumName: 'RoomFeatures',
		isArray: true,
	})
	features!: RoomFeatures[];
}
