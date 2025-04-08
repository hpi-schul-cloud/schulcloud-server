import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller/transformer';
import { ContentElementType } from '../../../domain';
import { bsonStringPattern } from '../bson-string-pattern';
import { TimestampsResponse } from '../timestamps.response';

export class FileFolderElementContent {
	constructor({ title }: FileFolderElementContent) {
		this.title = title;
	}

	@ApiProperty()
	@DecodeHtmlEntities()
	title: string;
}

export class FileFolderElementResponse {
	constructor({ id, content, timestamps, type }: FileFolderElementResponse) {
		this.id = id;
		this.content = content;
		this.timestamps = timestamps;
		this.type = type;
	}

	@ApiProperty({ pattern: bsonStringPattern })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.FILE_FOLDER;

	@ApiProperty()
	content: FileFolderElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
