import { ContentElementType } from '../enums/content-element-type.enum';
import { ExternalToolElementContentDto } from './external-tool-element-content.dto';
import { TimestampResponseDto } from './timestamp-response.dto';

export class ExternalToolElementResponseDto {
	id: string;

	type: ContentElementType;

	content: ExternalToolElementContentDto;

	timestamps: TimestampResponseDto;

	constructor(
		id: string,
		type: ContentElementType,
		content: ExternalToolElementContentDto,
		timestamps: TimestampResponseDto
	) {
		this.id = id;
		this.type = type;
		this.content = content;
		this.timestamps = timestamps;
	}
}
