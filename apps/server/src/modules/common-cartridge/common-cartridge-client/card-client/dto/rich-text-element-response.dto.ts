import { ContentElementType } from '../enums/content-element-type.enum';
import { RichTextElementContentDto } from './rich-text-element-content.dto';
import { TimestampResponseDto } from './timestamp-response.dto';

export class RichTextElementResponseDto {
	public id: string;

	public type: ContentElementType;

	public content: RichTextElementContentDto;

	public timestamps: TimestampResponseDto;

	constructor(props: Readonly<RichTextElementResponseDto>) {
		this.id = props.id;
		this.type = props.type;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}

	public static isRichTextElement(reference: unknown): reference is RichTextElementResponseDto {
		return reference instanceof RichTextElementResponseDto;
	}
}
