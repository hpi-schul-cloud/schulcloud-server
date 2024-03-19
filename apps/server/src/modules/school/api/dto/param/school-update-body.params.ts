import { ApiPropertyOptional } from '@nestjs/swagger';
import { LanguageType, Permission } from '@shared/domain/interface';
import { EntityId, SchoolFeature } from '@shared/domain/types';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsMongoId, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import {
	FileStorageType,
	SchoolPermissions,
	SchoolUpdateBody,
	StudentPermission,
	TeacherPermission,
} from '../../../domain';

export class SchoolLogo {
	@ApiPropertyOptional()
	@IsString()
	@IsOptional()
	dataUrl?: string;

	@ApiPropertyOptional()
	@IsString()
	@IsOptional()
	name?: string;
}

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
	@Matches(/^[a-zA-Z0-9-]+$/)
	@IsOptional()
	@ApiPropertyOptional()
	officialSchoolNumber?: string;

	@IsOptional()
	@ApiPropertyOptional()
	@ValidateNested()
	logo?: SchoolLogo;

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
	@Transform(({ value }: { value: SchoolFeature[] }) => new Set(value))
	features?: Set<SchoolFeature>;

	@Type(() => SchoolPermissionsParams)
	@IsOptional()
	@ApiPropertyOptional()
	@ValidateNested()
	permissions?: SchoolPermissionsParams;

	@IsMongoId()
	@IsOptional()
	@ApiPropertyOptional()
	countyId?: EntityId;

	@IsBoolean()
	@IsOptional()
	@ApiPropertyOptional()
	enableStudentTeamCreation?: boolean;
}
