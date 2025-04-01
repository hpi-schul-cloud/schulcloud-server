import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller/dto';
import { DecodeHtmlEntities } from '@shared/controller/transformer';
import { EntityId } from '@shared/domain/types';
import { FileRecord, PreviewStatus, ScanStatus } from '../../entity';
import { API_VERSION_PATH } from '../../files-storage.const';
import { FileRecordParentType, StorageLocation } from '../../interface';

export class FileRecordResponse {
	constructor(fileRecord: FileRecord) {
		this.id = fileRecord.id;
		this.name = fileRecord.name;
		this.url = `${API_VERSION_PATH}/file/download/${fileRecord.id}/${encodeURIComponent(fileRecord.name)}`;
		this.size = fileRecord.size;
		this.securityCheckStatus = fileRecord.securityCheck.status;
		this.parentId = fileRecord.parentId;
		this.creatorId = fileRecord.creatorId;
		this.mimeType = fileRecord.mimeType;
		this.parentType = fileRecord.parentType;
		this.isUploading = fileRecord.isUploading;
		this.deletedSince = fileRecord.deletedSince;
		this.previewStatus = fileRecord.getPreviewStatus();
		this.createdAt = fileRecord.createdAt;
		this.updatedAt = fileRecord.updatedAt;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	name: string;

	@ApiProperty()
	parentId: string;

	@ApiProperty()
	url: string;

	@ApiProperty({ enum: ScanStatus, enumName: 'FileRecordScanStatus' })
	securityCheckStatus: ScanStatus;

	@ApiProperty()
	size: number;

	@ApiProperty()
	creatorId?: string;

	@ApiProperty()
	mimeType: string;

	@ApiProperty({ enum: FileRecordParentType, enumName: 'FileRecordParentType' })
	parentType: FileRecordParentType;

	@ApiPropertyOptional()
	isUploading?: boolean;

	@ApiProperty({ enum: PreviewStatus, enumName: 'PreviewStatus' })
	previewStatus: PreviewStatus;

	@ApiPropertyOptional()
	deletedSince?: Date;

	@ApiPropertyOptional()
	createdAt?: Date;

	@ApiPropertyOptional()
	updatedAt?: Date;
}

export class FileRecordListResponse extends PaginationResponse<FileRecordResponse[]> {
	constructor(data: FileRecordResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [FileRecordResponse] })
	data: FileRecordResponse[];
}

export class CopyFileResponse {
	constructor(data: CopyFileResponse) {
		this.id = data.id;
		this.sourceId = data.sourceId;
		this.name = data.name;
	}

	@ApiPropertyOptional()
	id?: string;

	@ApiProperty()
	sourceId: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	name: string;
}

export class CopyFileListResponse extends PaginationResponse<CopyFileResponse[]> {
	constructor(data: CopyFileResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [CopyFileResponse] })
	data: CopyFileResponse[];
}

export class DeleteByStorageLocationResponse {
	constructor(data: DeleteByStorageLocationResponse) {
		this.storageLocationId = data.storageLocationId;
		this.storageLocation = data.storageLocation;
		this.deletedFiles = data.deletedFiles;
	}

	@ApiProperty()
	storageLocationId: EntityId;

	@ApiProperty({ enum: StorageLocation, enumName: 'StorageLocation' })
	storageLocation: StorageLocation;

	@ApiProperty()
	deletedFiles: number;
}
