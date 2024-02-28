import { ApiPropertyOptional } from '@nestjs/swagger';
import { LanguageType } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { SchoolFeature } from '@shared/domain/types';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import {
	FileStorageType,
	SchoolPermissions,
	SchoolUpdateBody,
	StudentPermission,
	TeacherPermission,
} from '../../../domain';

class TeacherPermissionParams implements TeacherPermission {
	@ApiPropertyOptional()
	@IsBoolean()
	[Permission.STUDENT_LIST]?: boolean;
}

class StudentPermissionParams implements StudentPermission {
	@ApiPropertyOptional()
	@IsBoolean()
	[Permission.LERNSTORE_VIEW]?: boolean;
}

class SchoolPermissionsParams implements SchoolPermissions {
	@IsOptional()
	@ValidateNested()
	@ApiPropertyOptional()
	teacher?: TeacherPermissionParams;

	@IsOptional()
	@ValidateNested()
	@ApiPropertyOptional()
	student?: StudentPermissionParams;
}

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
	@ApiPropertyOptional({ enum: SchoolFeature, enumName: 'SchoolFeature', isArray: true })
	@Type(() => Set)
	features?: Set<SchoolFeature>;

	@Type(() => SchoolPermissionsParams)
	@IsOptional()
	@ApiPropertyOptional()
	@ValidateNested()
	permissions?: SchoolPermissionsParams;
}
