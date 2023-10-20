import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ToolContextType } from '../../../interface';
import { CustomParameterEntryParam } from './custom-parameter-entry.params';

export class ContextExternalToolPostParams {
	@ApiProperty()
	@IsMongoId()
	schoolToolId!: string;

	@ApiProperty()
	@IsMongoId()
	contextId!: string;

	@IsEnum(ToolContextType)
	@ApiProperty()
	contextType!: ToolContextType;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	displayName?: string;

	@ValidateNested({ each: true })
	@IsArray()
	@IsOptional()
	@ApiPropertyOptional({ type: [CustomParameterEntryParam] })
	@Type(() => CustomParameterEntryParam)
	parameters?: CustomParameterEntryParam[];

	@ApiProperty()
	@IsNumber()
	toolVersion!: number;
}
