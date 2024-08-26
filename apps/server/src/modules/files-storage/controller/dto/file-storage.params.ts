import { ScanResult } from '@infra/antivirus';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StringToBoolean } from '@shared/controller';
import { EntityId } from '@shared/domain/types';
import { Allow, IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { FileRecordParentType, PreviewOutputMimeTypes, PreviewWidth, StorageLocation } from '../../interface';

export class FileRecordParams {
	@ApiProperty()
	@IsMongoId()
	storageLocationId!: EntityId;

	@ApiProperty({ enum: StorageLocation, enumName: 'StorageLocation' })
	@IsEnum(StorageLocation)
	storageLocation!: StorageLocation;

	@ApiProperty()
	@IsMongoId()
	parentId!: EntityId;

	@ApiProperty({ enum: FileRecordParentType, enumName: 'FileRecordParentType' })
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

export class ScanResultParams implements ScanResult {
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
	@ApiPropertyOptional({ enum: PreviewOutputMimeTypes, enumName: 'PreviewOutputMimeTypes' })
	@IsOptional()
	@IsEnum(PreviewOutputMimeTypes)
	outputFormat?: PreviewOutputMimeTypes;

	@ApiPropertyOptional({ enum: PreviewWidth, enumName: 'PreviewWidth' })
	@IsOptional()
	@IsEnum(PreviewWidth)
	width?: PreviewWidth;

	@IsOptional()
	@IsBoolean()
	@StringToBoolean()
	@ApiPropertyOptional({
		description: 'If true, the preview will be generated again.',
	})
	forceUpdate?: boolean;
}
