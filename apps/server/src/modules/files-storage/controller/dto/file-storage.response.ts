import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities, PaginationResponse } from '@shared/controller';
import { FileRecord, FileRecordParentType, ScanStatus } from '../../entity';

export class FileRecordResponse {
	constructor(fileRecord: FileRecord) {
		this.id = fileRecord.id;
		this.name = fileRecord.name;
		this.size = fileRecord.size;
		this.securityCheckStatus = fileRecord.securityCheck.status;
		this.parentId = fileRecord.parentId;
		this.creatorId = fileRecord.creatorId;
		this.mimeType = fileRecord.mimeType;
		this.parentType = fileRecord.parentType;
		this.deletedSince = fileRecord.deletedSince;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	name: string;

	@ApiProperty()
	parentId: string;

	@ApiProperty({ enum: ScanStatus })
	securityCheckStatus: ScanStatus;

	@ApiProperty()
	size: number;

	@ApiProperty()
	creatorId: string;

	@ApiProperty()
	mimeType: string;

	@ApiProperty({ enum: FileRecordParentType })
	parentType: FileRecordParentType;

	@ApiPropertyOptional()
	deletedSince?: Date;
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
