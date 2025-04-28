import { ScanResult } from '@infra/antivirus';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StringToBoolean } from '@shared/controller/transformer';
import { EntityId } from '@shared/domain/types';
import { Allow, IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ParentInfo, PreviewOutputMimeTypes } from '../../domain/file-record.do';
import {
	FileRecordParentType,
	PreviewInfo,
	PreviewWidth,
	StorageLocation,
	StorageLocationParams,
} from '../../domain/interface';

// "paramsDto" is the same information twice
export class StorageLocationParamsDto implements StorageLocationParams {
	@ApiProperty()
	@IsMongoId()
	public storageLocationId!: EntityId;

	@ApiProperty({ enum: StorageLocation, enumName: 'StorageLocation' })
	@IsEnum(StorageLocation)
	public storageLocation!: StorageLocation;
}

export class FileRecordParams implements ParentInfo {
	@ApiProperty()
	@IsMongoId()
	public storageLocationId!: EntityId;

	@ApiProperty({ enum: StorageLocation, enumName: 'StorageLocation' })
	@IsEnum(StorageLocation)
	public storageLocation!: StorageLocation;

	@ApiProperty()
	@IsMongoId()
	public parentId!: EntityId;

	@ApiProperty({ enum: FileRecordParentType, enumName: 'FileRecordParentType' })
	@IsEnum(FileRecordParentType)
	public parentType!: FileRecordParentType;
}

export class FileUrlParams {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	public url!: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	public fileName!: string;

	@ApiPropertyOptional()
	@Allow()
	public headers?: Record<string, string>;
}

export class FileParams {
	@ApiProperty({ type: 'string', format: 'binary' })
	@Allow()
	public file!: string;
}

export class DownloadFileParams {
	@ApiProperty()
	@IsMongoId()
	public fileRecordId!: EntityId;

	@ApiProperty()
	@IsString()
	public fileName!: string;
}

export class ScanResultParams implements ScanResult {
	@ApiProperty()
	@Allow()
	public virus_detected?: boolean;

	@ApiProperty()
	@Allow()
	public virus_signature?: string;

	@ApiProperty()
	@Allow()
	public error?: string;
}

export class SingleFileParams {
	@ApiProperty()
	@IsMongoId()
	public fileRecordId!: EntityId;
}

export class RenameFileParams {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	public fileName!: string;
}

export class CopyFilesOfParentParams {
	@ApiProperty()
	@ValidateNested()
	public target!: FileRecordParams;
}

export class CopyFileParams {
	@ApiProperty()
	@ValidateNested()
	public target!: FileRecordParams;

	@ApiProperty()
	@IsString()
	public fileNamePrefix!: string;
}

export class CopyFilesOfParentPayload {
	@IsMongoId()
	public userId!: EntityId;

	@ValidateNested()
	public source!: FileRecordParams;

	@ValidateNested()
	public target!: FileRecordParams;
}

export class PreviewParams implements PreviewInfo {
	@ApiPropertyOptional({ enum: PreviewOutputMimeTypes, enumName: 'PreviewOutputMimeTypes' })
	@IsOptional()
	@IsEnum(PreviewOutputMimeTypes)
	public outputFormat?: PreviewOutputMimeTypes;

	@ApiPropertyOptional({ enum: PreviewWidth, enumName: 'PreviewWidth' })
	@IsOptional()
	@IsEnum(PreviewWidth)
	public width?: PreviewWidth;

	@IsOptional()
	@IsBoolean()
	@StringToBoolean()
	@ApiPropertyOptional({
		description: 'If true, the preview will be generated again.',
	})
	public forceUpdate?: boolean;
}
