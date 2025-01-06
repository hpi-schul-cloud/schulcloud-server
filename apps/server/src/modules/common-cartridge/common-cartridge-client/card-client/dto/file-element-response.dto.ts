import { ContentElementType } from '../enums/content-element-type.enum';
import { FileElementContentDto } from './file-element-content.dto';
import { TimestampResponseDto } from './timestamp-response.dto';

export class FileElementResponseDto {
	public id: string;

	public type: ContentElementType;

	public content: FileElementContentDto;

	public timestamps: TimestampResponseDto;

	constructor(id: string, type: ContentElementType, content: FileElementContentDto, timestamps: TimestampResponseDto) {
		this.id = id;
		this.type = type;
		this.content = content;
		this.timestamps = timestamps;
	}

	public static isFileElement(reference: unknown): reference is FileElementResponseDto {
		return reference instanceof FileElementResponseDto;
	}
}
