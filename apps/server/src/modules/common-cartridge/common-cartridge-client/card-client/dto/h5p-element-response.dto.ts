import { ContentElementType } from '../enums/content-element-type.enum';
import { H5pElementContentDto } from './h5p-element-content.dto';
import { TimestampResponseDto } from './timestamp-response.dto';

export class H5pElementResponseDto {
	public id: string;

	public type: ContentElementType;

	public content: H5pElementContentDto;

	public timestamps: TimestampResponseDto;

	constructor(id: string, type: ContentElementType, content: H5pElementContentDto, timestamps: TimestampResponseDto) {
		this.id = id;
		this.type = type;
		this.content = content;
		this.timestamps = timestamps;
	}
}
