import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomParameterEntryParam } from './custom-parameter-entry.params';

export class SchoolExternalToolPostParams {
	@ApiProperty()
	@IsString()
	toolId!: string;

	@ApiProperty()
	@IsString()
	schoolId!: string;

	@ValidateNested({ each: true })
	@IsArray()
	@IsOptional()
	@ApiPropertyOptional({ type: [CustomParameterEntryParam] })
	@Type(() => CustomParameterEntryParam)
	parameters?: CustomParameterEntryParam[];

	@ApiProperty()
	@IsNumber()
	version!: number;
}
