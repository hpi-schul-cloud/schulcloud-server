import { ApiPropertyOptional } from '@nestjs/swagger';
import { SingleValueToArrayTransformer } from '@shared/controller';
import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { SystemType } from '../../domain';

export class SystemFilterParams {
	@ApiPropertyOptional({ description: 'The type of the system.', enum: SystemType, enumName: 'SystemType' })
	@SingleValueToArrayTransformer()
	@IsOptional()
	@IsArray()
	@IsEnum(SystemType, { each: true })
	types?: SystemType[];
}
