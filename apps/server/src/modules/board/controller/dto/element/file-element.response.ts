import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { DecodeHtmlEntities } from '@shared/controller/transformer';
import { ContentElementType } from '../../../domain';
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
