import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller/dto';
import { DecodeHtmlEntities } from '@shared/controller/transformer';
import { EntityId } from '@shared/domain/types';
import { FileRecord, PreviewStatus, ScanStatus } from '../../domain';
import { FileRecordParentType, StorageLocation } from '../../domain/interface';

export class FileRecordResponse {
	constructor(fileRecord: FileRecord) {
		const props = fileRecord.getProps();

		this.id = props.id;
		this.name = props.name;
		this.url = `/api/v3/file/download/${props.id}/${encodeURIComponent(props.name)}`;
		this.size = props.size;
		this.securityCheckStatus = fileRecord.scanStatus;
		this.parentId = props.parentId;
		this.creatorId = props.creatorId;
		this.mimeType = props.mimeType;
		this.parentType = props.parentType;
		this.isUploading = props.isUploading;
		this.deletedSince = props.deletedSince;
		this.previewStatus = fileRecord.getPreviewStatus();
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}

	@ApiProperty()
	public id: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	public name: string;

	@ApiProperty()
	public parentId: string;

	@ApiProperty()
	public url: string;

	@ApiProperty({ enum: ScanStatus, enumName: 'FileRecordScanStatus' })
	public securityCheckStatus: ScanStatus;

	@ApiProperty()
	public size: number;

	@ApiProperty()
	public creatorId?: string;

	@ApiProperty()
	public mimeType: string;

	@ApiProperty({ enum: FileRecordParentType, enumName: 'FileRecordParentType' })
	public parentType: FileRecordParentType;

	@ApiPropertyOptional()
	public isUploading?: boolean;

	@ApiProperty({ enum: PreviewStatus, enumName: 'PreviewStatus' })
	public previewStatus: PreviewStatus;

	@ApiPropertyOptional()
	public deletedSince?: Date;

	@ApiPropertyOptional()
	public createdAt?: Date;

	@ApiPropertyOptional()
	public updatedAt?: Date;
}

export class FileRecordListResponse extends PaginationResponse<FileRecordResponse[]> {
	constructor(data: FileRecordResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [FileRecordResponse] })
	public data: FileRecordResponse[];
}

export class CopyFileResponse {
	constructor(data: CopyFileResponse) {
		this.id = data.id;
		this.sourceId = data.sourceId;
		this.name = data.name;
	}

	@ApiPropertyOptional()
	public id?: string;

	@ApiProperty()
	public sourceId: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	public name: string;
}

export class CopyFileListResponse extends PaginationResponse<CopyFileResponse[]> {
	constructor(data: CopyFileResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [CopyFileResponse] })
	public data: CopyFileResponse[];
}

export class DeleteByStorageLocationResponse {
	constructor(data: DeleteByStorageLocationResponse) {
		this.storageLocationId = data.storageLocationId;
		this.storageLocation = data.storageLocation;
		this.deletedFiles = data.deletedFiles;
	}

	@ApiProperty()
	public storageLocationId: EntityId;

	@ApiProperty({ enum: StorageLocation, enumName: 'StorageLocation' })
	public storageLocation: StorageLocation;

	@ApiProperty()
	public deletedFiles: number;
}
