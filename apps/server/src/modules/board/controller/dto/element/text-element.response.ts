import { ApiProperty } from '@nestjs/swagger';
import { ContentElementType } from '../../../types/content-elements.enum';
import { TimestampsResponse } from '../timestamps.response';

export class TextElementContent {
	constructor({ text }: TextElementContent) {
		this.text = text;
	}

	@ApiProperty()
	text: string;
}

export class TextElementResponse {
	constructor({ id, content, timestamps, type }: TextElementResponse) {
		this.id = id;
		this.content = content;
		this.timestamps = timestamps;
		this.type = type;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty({
		enum: ContentElementType,
	})
	type: ContentElementType;

	@ApiProperty()
	content: TextElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
