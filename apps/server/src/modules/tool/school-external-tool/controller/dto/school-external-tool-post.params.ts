import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator';
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
}
