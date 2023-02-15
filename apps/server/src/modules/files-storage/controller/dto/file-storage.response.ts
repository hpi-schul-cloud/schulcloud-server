import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities, PaginationResponse } from '@shared/controller';
import { FileRecord, FileRecordParentType, ScanStatus } from '../../domain';

export class FileRecordResponse {
	constructor(fileRecord: FileRecord) {
		const props = fileRecord.getProps();
		this.id = fileRecord.id;
		this.name = props.name;
		this.size = props.size;
		this.securityCheckStatus = props.securityCheck.status;
		this.parentId = props.parentId;
		this.creatorId = props.creatorId;
		this.type = props.mimeType;
		this.parentType = props.parentType;
		this.deletedSince = props.deletedSince;
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
