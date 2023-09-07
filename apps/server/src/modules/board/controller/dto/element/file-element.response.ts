import { ApiProperty } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain';
import { TimestampsResponse } from '../timestamps.response';

export class FileElementContent {
	constructor({ caption, alternativeText }: FileElementContent) {
		this.caption = caption;
		this.alternativeText = alternativeText;
	}

	@ApiProperty()
	caption: string;

	@ApiProperty()
	alternativeText?: string;
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
