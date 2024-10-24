import { ContentElementType } from '../enums/content-element-type.enum';
import { RichTextElementContentDto } from './rich-text-element-content.dto';
import { TimestampResponseDto } from './timestamp-response.dto';

export class RichTextElementResponseDto {
	id: string;

	type: ContentElementType;

	content: RichTextElementContentDto;

	timestamps: TimestampResponseDto;

	constructor(
		id: string,
		type: ContentElementType,
		content: RichTextElementContentDto,
		timestamps: TimestampResponseDto
	) {
		this.id = id;
		this.type = type;
		this.content = content;
		this.timestamps = timestamps;
	}
}
