import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { StringToBoolean } from '@shared/controller';

export class LtiToolParams {
	@IsOptional()
	@IsString()
	@ApiProperty({ required: false })
	name?: string;

	@IsOptional()
	@IsBoolean()
	@StringToBoolean()
	@ApiProperty({ required: false })
	isTemplate?: boolean;

	@IsOptional()
	@IsBoolean()
	@StringToBoolean()
	@ApiProperty({ required: false })
	isHidden?: boolean;

	@IsOptional()
	@IsString()
	@ApiProperty({ required: false })
	friendlyUrl?: string;
}
