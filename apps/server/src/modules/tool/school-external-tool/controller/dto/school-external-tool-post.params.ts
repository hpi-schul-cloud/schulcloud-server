import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CustomParameterEntryParam } from '../../../common/dto';

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

	@ApiProperty()
	@IsNumber()
	version!: number;
}
