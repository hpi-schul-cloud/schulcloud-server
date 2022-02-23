/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { FileRecord, FileRecordTargetType } from '@shared/domain/'; // we do not want entity on this place in future or?

export class FileRecordResponse {
	constructor(fileRecord: FileRecord) {
		this.id = fileRecord.id;
		this.name = fileRecord.name;
		this.targetId = fileRecord.targetId;
		this.creatorId = fileRecord.creatorId;
		this.type = fileRecord.type;
		this.targetType = fileRecord.targetType;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	name: string;

	@ApiProperty()
	targetId: string;

	@ApiProperty()
	creatorId: string;

	@ApiProperty()
	type: string;

	@ApiProperty()
	targetType: FileRecordTargetType;
}
