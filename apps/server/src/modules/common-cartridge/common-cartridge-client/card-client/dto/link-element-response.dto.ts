import { ContentElementType } from '../enums/content-element-type.enum';
import { LinkElementContentDto } from './link-element-content.dto';
import { TimestampResponseDto } from './timestamp-response.dto';

export class LinkElementResponseDto {
	id: string;

	type: ContentElementType;

	content: LinkElementContentDto;

	timestamps: TimestampResponseDto;

	constructor(id: string, type: ContentElementType, content: LinkElementContentDto, timestamps: TimestampResponseDto) {
		this.id = id;
		this.type = type;
		this.content = content;
		this.timestamps = timestamps;
	}
}
