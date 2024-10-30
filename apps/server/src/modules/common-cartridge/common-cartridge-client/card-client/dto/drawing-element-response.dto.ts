import { ContentElementType } from '../enums/content-element-type.enum';
import { DrawingElementContentDto } from './drawing-element-content.dto';
import { TimestampResponseDto } from './timestamp-response.dto';

export class DrawingElementResponseDto {
	id: string;

	type: ContentElementType;

	timestamps: TimestampResponseDto;

	content: DrawingElementContentDto;

	constructor(
		id: string,
		type: ContentElementType,
		content: DrawingElementContentDto,
		timestamps: TimestampResponseDto
	) {
		this.id = id;
		this.type = type;
		this.timestamps = timestamps;
		this.content = content;
	}
}
