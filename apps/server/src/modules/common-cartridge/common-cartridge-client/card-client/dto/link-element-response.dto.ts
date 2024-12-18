import { ContentElementType } from '../enums/content-element-type.enum';
import { LinkElementContentDto } from './link-element-content.dto';
import { TimestampResponseDto } from './timestamp-response.dto';

export class LinkElementResponseDto {
	public id: string;

	public type: ContentElementType;

	public content: LinkElementContentDto;

	public timestamps: TimestampResponseDto;

	constructor(props: LinkElementResponseDto) {
		this.id = props.id;
		this.type = props.type;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}

	public static isLinkElement(reference: unknown): reference is LinkElementResponseDto {
		return reference instanceof LinkElementResponseDto;
	}
}
