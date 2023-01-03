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
		this.type = fileRecord.mimeType;
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

	@ApiProperty()
	securityCheckStatus: ScanStatus;

	@ApiProperty()
	size: number;

	@ApiProperty()
	creatorId: string;

	@ApiProperty()
	type: string;

	@ApiProperty()
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

	@ApiProperty()
	id?: string | undefined;

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
