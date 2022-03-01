/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { FileRecord, FileRecordParentType } from '@shared/domain/'; // we do not want entity on this place in future or?

export class FileRecordResponse {
	constructor(fileRecord: FileRecord) {
		this.id = fileRecord.id;
		this.name = fileRecord.name;
		this.parentId = fileRecord.parentId;
		this.creatorId = fileRecord.creatorId;
		this.type = fileRecord.mimeType;
		this.parentType = fileRecord.parentType;
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

	@ApiProperty({ enum: FileRecordParentType })
	parentType: FileRecordParentType;
}
