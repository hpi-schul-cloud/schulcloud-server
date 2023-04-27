import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomParameterEntryParam } from './custom-parameter-entry.params';
import { ToolContextType } from '../../../interface';

export class ContextExternalToolPostParams {
	@ApiProperty()
	@IsString()
	@IsMongoId()
	schoolToolId!: string;

	@ApiProperty()
	@IsString()
	@IsMongoId()
	contextId!: string;

	@IsEnum(ToolContextType)
	@ApiProperty()
	contextType!: ToolContextType;

	@ApiProperty()
	@IsString()
	contextToolName?: string;

	@ValidateNested({ each: true })
	@IsArray()
	@IsOptional()
	@ApiPropertyOptional({ type: [CustomParameterEntryParam] })
	@Type(() => CustomParameterEntryParam)
	parameters: CustomParameterEntryParam[] = [];

	@ApiProperty()
	@IsNumber()
	toolVersion!: number;
}
