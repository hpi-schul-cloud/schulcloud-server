import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ToolContextType } from '../../../common/enum';
import { CustomParameterEntryParam } from './custom-parameter-entry.params';

export class SchoolExternalToolPostParams {
	@ApiProperty()
	@IsString()
	@IsMongoId()
	toolId!: string;

	@ApiProperty()
	@IsString()
	@IsMongoId()
	schoolId!: string;

	@ValidateNested({ each: true })
	@IsArray()
	@IsOptional()
	@ApiPropertyOptional({ type: [CustomParameterEntryParam] })
	@Type(() => CustomParameterEntryParam)
	parameters?: CustomParameterEntryParam[];

	@ApiProperty({
		type: Boolean,
		default: false,
		description: 'Tool can be deactivated, related tools can not be added to e.g. course or board anymore',
	})
	@IsBoolean()
	isDeactivated!: boolean;

	@ApiProperty({
		type: Array<ToolContextType>,
		description: 'List of tool contexts where the school external tool is available',
		isArray: true,
		enum: ToolContextType,
		enumName: 'ToolContextType',
		example: [ToolContextType.BOARD_ELEMENT],
	})
	@IsArray()
	@IsEnum(ToolContextType, { each: true })
	availableContexts!: ToolContextType[];
}
