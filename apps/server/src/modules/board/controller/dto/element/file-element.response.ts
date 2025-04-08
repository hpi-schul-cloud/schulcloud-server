import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller/transformer';
import { ContentElementType } from '../../../domain';
import { bsonStringPattern } from '../bson-string-pattern';
import { TimestampsResponse } from '../timestamps.response';

export class FileElementContent {
	constructor({ caption, alternativeText }: FileElementContent) {
		this.caption = caption;
		this.alternativeText = alternativeText;
	}

	@ApiProperty()
	@DecodeHtmlEntities()
	caption: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	alternativeText: string;
}

export class FileElementResponse {
	constructor({ id, content, timestamps, type }: FileElementResponse) {
		this.id = id;
		this.content = content;
		this.timestamps = timestamps;
		this.type = type;
	}

	@ApiProperty({ pattern: bsonStringPattern })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.FILE;

	@ApiProperty()
	content: FileElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
