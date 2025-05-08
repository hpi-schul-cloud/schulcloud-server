import { ContentElementType } from '../enums/content-element-type.enum';
import { FileFolderElementContentDto } from './file-folder-element-content.dto';
import { TimestampResponseDto } from './timestamp-response.dto';

export class FileFolderElementResponseDto {
	constructor(
		public id: string,
		public type: ContentElementType,
		public content: FileFolderElementContentDto,
		public timestamps: TimestampResponseDto
	) {}
}
