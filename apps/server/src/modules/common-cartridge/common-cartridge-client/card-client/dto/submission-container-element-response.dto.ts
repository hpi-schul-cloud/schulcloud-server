import { ContentElementType } from '../cards-api-client';
import { SubmissionContainerElementContentDto } from './submission-container-element-content.dto';
import { TimestampResponseDto } from './timestamp-response.dto';

export class SubmissionContainerElementResponseDto {
	id: string;

	type: ContentElementType;

	content: SubmissionContainerElementContentDto;

	timestamps: TimestampResponseDto;

	constructor(
		id: string,
		type: ContentElementType,
		content: SubmissionContainerElementContentDto,
		timestamps: TimestampResponseDto
	) {
		this.id = id;
		this.type = type;
		this.content = content;
		this.timestamps = timestamps;
	}
}
