import { ApiProperty } from '@nestjs/swagger';
import { StringToBoolean } from '@shared/controller';
import { SystemTypeEnum } from '@shared/domain';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class SystemFilterParams {
	@ApiProperty({
		description: 'The type of the system.',
		required: false,
		nullable: true,
	})
	@IsOptional()
	@IsEnum(SystemTypeEnum)
	type?: SystemTypeEnum;

	@ApiProperty({
		description: 'Flag to request only systems with oauth-config.',
		required: false,
		nullable: true,
	})
	@IsOptional()
	@IsBoolean()
	@StringToBoolean()
	onlyOauth?: boolean;
}
