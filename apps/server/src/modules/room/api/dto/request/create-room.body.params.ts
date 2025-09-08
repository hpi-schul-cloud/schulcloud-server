import { RoomCreateProps } from '@modules/room/domain';
import { RoomColor, RoomFeatures } from '@modules/room/domain/type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NullToUndefined, SanitizeHtml } from '@shared/controller/transformer';
import { IsArray, IsDate, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRoomBodyParams implements Omit<RoomCreateProps, 'schoolId'> {
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

	@IsOptional()
	@NullToUndefined()
	@IsDate()
	@ApiPropertyOptional({
		description: 'Start date of the room',
		required: false,
		type: Date,
	})
	startDate?: Date;

	@IsOptional()
	@NullToUndefined()
	@IsDate()
	@ApiPropertyOptional({
		description: 'End date of the room',
		required: false,
		type: Date,
	})
	endDate?: Date;

	@IsArray()
	@IsEnum(RoomFeatures, { each: true })
	@ApiProperty({
		name: 'features',
		description: 'The features of the room',
		enum: RoomFeatures,
		enumName: 'RoomFeatures',
		isArray: true,
	})
	features!: RoomFeatures[];
}
