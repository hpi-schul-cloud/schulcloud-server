import { ContentElementType } from '../cards-api-client';
import { DeletedElementContentDto } from './deleted-element-content.dto';
import { TimestampResponseDto } from './timestamp-response.dto';

export class DeletedElementResponseDto {
	id: string;

	type: ContentElementType;

	content: DeletedElementContentDto;

	timestamps: TimestampResponseDto;

	constructor(
		id: string,
		type: ContentElementType,
		content: DeletedElementContentDto,
		timestamps: TimestampResponseDto
	) {
		this.id = id;
		this.type = type;
		this.content = content;
		this.timestamps = timestamps;
	}
}
