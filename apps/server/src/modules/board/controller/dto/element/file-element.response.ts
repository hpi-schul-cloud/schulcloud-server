import { ApiProperty } from '@nestjs/swagger';
import { ContentElementType } from '../../../types/content-elements.enum';
import { TimestampsResponse } from '../timestamps.response';

export class FileElementContent {
	constructor({ caption }: FileElementContent) {
		this.caption = caption;
	}

	@ApiProperty()
	caption: string;
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

	@ApiProperty({
		enum: ContentElementType,
	})
	type: ContentElementType;

	@ApiProperty()
	content: FileElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
