import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
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

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.FILE;

	@ApiProperty()
	content: FileElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
