import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities, PaginationResponse } from '@shared/controller';
import { FileRecord, FileRecordParentType } from '@shared/domain/'; // we do not want entity on this place in future or?

export class FileRecordResponse {
	constructor(fileRecord: FileRecord) {
		this.id = fileRecord.id;
		this.name = fileRecord.name;
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
