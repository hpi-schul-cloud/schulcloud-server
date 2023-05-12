import { ApiProperty } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain';
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

	@ApiProperty()
	type: ContentElementType.TEXT;

	@ApiProperty()
	content: TextElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
