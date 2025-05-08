import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { InputFormat } from '@shared/domain/types';
import { ContentElementType } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';

export class RichTextElementContent {
	constructor({ text, inputFormat }: RichTextElementContent) {
		this.text = text;
		this.inputFormat = inputFormat;
	}

	@ApiProperty()
	text: string;

	@ApiProperty()
	inputFormat: InputFormat;
}

export class RichTextElementResponse {
	constructor({ id, content, timestamps, type }: RichTextElementResponse) {
		this.id = id;
		this.content = content;
		this.timestamps = timestamps;
		this.type = type;
	}

	@ApiProperty({ pattern: bsonStringPattern })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.RICH_TEXT;

	@ApiProperty()
	content: RichTextElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
