import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToolContextType } from '@src/modules/tool/common/enum/tool-context-type.enum';
import { CustomParameterEntryParam } from '@src/modules/tool/school-external-tool/controller/dto/custom-parameter-entry.params';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

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
