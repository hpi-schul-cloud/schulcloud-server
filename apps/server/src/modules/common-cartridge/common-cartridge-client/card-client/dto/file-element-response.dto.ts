import { ContentElementType } from '../enums/content-element-type.enum';
import { FileElementContentDto } from './file-element-content.dto';
import { TimestampResponseDto } from './timestamp-response.dto';

export class FileElementResponseDto {
	id: string;

	type: ContentElementType;

	content: FileElementContentDto;

	timestamps: TimestampResponseDto;

	constructor(id: string, type: ContentElementType, content: FileElementContentDto, timestamps: TimestampResponseDto) {
		this.id = id;
		this.type = type;
		this.content = content;
		this.timestamps = timestamps;
	}
}
