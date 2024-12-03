import { ContentElementType } from '../enums/content-element-type.enum';
import { LinkElementContentDto } from './link-element-content.dto';
import { TimestampResponseDto } from './timestamp-response.dto';

export class LinkElementResponseDto {
	id: string;

	type: ContentElementType;

	content: LinkElementContentDto;

	timestamps: TimestampResponseDto;

	constructor(props: LinkElementResponseDto) {
		this.id = props.id;
		this.type = props.type;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}
}
