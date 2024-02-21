import { ApiPropertyOptional } from '@nestjs/swagger';
import { LanguageType } from '@shared/domain/entity';
import { SchoolFeature } from '@shared/domain/types';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FileStorageType, SchoolUpdateBody } from '../../../domain';

export class SchoolUpdateBodyParams implements SchoolUpdateBody {
	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	name?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	officialSchoolNumber?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	logo_dataUrl?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	logo_name?: string;

	@IsEnum(FileStorageType)
	@IsOptional()
	@ApiPropertyOptional({ enum: FileStorageType })
	fileStorageType?: FileStorageType;

	@IsEnum(LanguageType)
	@IsOptional()
	@ApiPropertyOptional({ enum: LanguageType })
	language?: LanguageType;

	@IsEnum(SchoolFeature, { each: true })
	@IsOptional()
	@ApiPropertyOptional({ enum: SchoolFeature, isArray: true })
	@Type(() => Set)
	features?: Set<SchoolFeature>;
}
