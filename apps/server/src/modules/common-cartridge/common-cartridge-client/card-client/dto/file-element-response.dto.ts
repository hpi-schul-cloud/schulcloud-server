import { ContentElementType } from '../enums/content-element-type.enum';
import { FileElementContentDto } from './file-element-content.dto';
import { TimestampResponseDto } from './timestamp-response.dto';

export class FileElementResponseDto {
	public id: string;

	public type: ContentElementType;

	public content: FileElementContentDto;

	public timestamps: TimestampResponseDto;

	constructor(props: Readonly<FileElementResponseDto>) {
		this.id = props.id;
		this.type = props.type;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}

	public static isFileElement(reference: unknown): reference is FileElementResponseDto {
		return reference instanceof FileElementResponseDto;
	}
}
