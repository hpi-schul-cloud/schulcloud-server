import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StringToBoolean } from '@shared/controller';
import { EntityId } from '@shared/domain';
import { Allow, IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { FileRecordParentType } from '../../entity';
import { PreviewHeight, PreviewOutputMimeTypes, PreviewWidth } from '../../interface';

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
	@ApiPropertyOptional({ enum: PreviewOutputMimeTypes })
	@IsOptional()
	@IsEnum(PreviewOutputMimeTypes)
	outputFormat?: PreviewOutputMimeTypes;

	@ApiPropertyOptional({ enum: PreviewWidth })
	@IsOptional()
	@IsEnum(PreviewWidth)
	width?: PreviewWidth;

	@ApiPropertyOptional({ enum: PreviewHeight })
	@IsOptional()
	@IsEnum(PreviewHeight)
	height?: PreviewHeight;

	@IsOptional()
	@IsBoolean()
	@StringToBoolean()
	@ApiPropertyOptional({
		description: 'If true, the preview will be generated again.',
	})
	forceUpdate?: boolean;
}
