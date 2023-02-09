import { ApiPropertyOptional } from '@nestjs/swagger';
import { StringToBoolean } from '@shared/controller';
import { SystemTypeEnum } from '@shared/domain';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class SystemFilterParams {
	@ApiPropertyOptional({ description: 'The type of the system.' })
	@IsOptional()
	@IsEnum(SystemTypeEnum)
	type?: SystemTypeEnum;

	@ApiPropertyOptional({ description: 'Flag to request only systems with oauth-config.' })
	@IsOptional()
	@IsBoolean()
	@StringToBoolean()
	onlyOauth?: boolean;
}
