import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityId } from '@shared/domain';
import {
	Allow,
	IsBoolean,
	IsEnum,
	IsInt,
	IsMongoId,
	IsNotEmpty,
	IsOptional,
	IsString,
	ValidateNested,
} from 'class-validator';
import { FileRecordParentType } from '../../entity';
import { PreviewOutputMimeTypes } from '../../interface/preview-output-mime-types.enum';

export class FileRecordParams {
	@ApiProperty()
	@IsMongoId()
	schoolId!: EntityId;

	@ApiProperty()
	@IsMongoId()
	parentId!: EntityId;

	@ApiProperty({ enum: FileRecordParentType })
	@IsEnum(FileRecordParentType)
	parentType!: FileRecordParentType;
}

export class FileUrlParams {
	@ApiProperty({ type: 'string' })
	@IsString()
	@IsNotEmpty()
	url!: string;

	@ApiProperty({ type: 'string' })
	@IsString()
	@IsNotEmpty()
	fileName!: string;

	@ApiProperty({ type: 'string' })
	@Allow()
	headers?: Record<string, string>;
}

export class FileParams {
	@ApiProperty({ type: 'string', format: 'binary' })
	@Allow()
	file!: string;
}

export class DownloadFileParams {
	@ApiProperty()
	@IsMongoId()
	fileRecordId!: EntityId;

	@ApiProperty()
	@IsString()
	fileName!: string;
}

export class ScanResultParams {
	@ApiProperty()
	@Allow()
	virus_detected?: boolean;

	@ApiProperty()
	@Allow()
	virus_signature?: string;

	@ApiProperty()
	@Allow()
	error?: string;
}

export class SingleFileParams {
	@ApiProperty()
	@IsMongoId()
	fileRecordId!: EntityId;
}

export class RenameFileParams {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	fileName!: string;
}

export class CopyFilesOfParentParams {
	@ApiProperty()
	@ValidateNested()
	target!: FileRecordParams;
}

export class CopyFileParams {
	@ApiProperty()
	@ValidateNested()
	target!: FileRecordParams;

	@ApiProperty()
	@IsString()
	fileNamePrefix!: string;
}

export class CopyFilesOfParentPayload {
	@IsMongoId()
	userId!: EntityId;

	@ValidateNested()
	source!: FileRecordParams;

	@ValidateNested()
	target!: FileRecordParams;
}

export class PreviewParams {
	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	width?: number;

	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	height?: number;

	@ApiPropertyOptional({ enum: PreviewOutputMimeTypes })
	@IsEnum(PreviewOutputMimeTypes)
	outputFormat?: PreviewOutputMimeTypes;

	@ApiPropertyOptional({
		type: 'boolean',
		default: false,
		description: 'If true, the preview will be generated again."',
	})
	@IsOptional()
	@IsBoolean()
	forceUpdate?: boolean;
}
