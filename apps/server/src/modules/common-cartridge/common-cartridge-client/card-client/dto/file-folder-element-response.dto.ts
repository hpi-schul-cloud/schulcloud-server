import { ContentElementType } from '../enums/content-element-type.enum';
import { FileFolderElementContentDto } from './file-folder-element-content.dto';
import { TimestampResponseDto } from './timestamp-response.dto';

export class FileFolderElementResponseDto {
	public id: string;
	public type: ContentElementType;
	public content: FileFolderElementContentDto;
	public timestamps: TimestampResponseDto;

	constructor(props: Readonly<FileFolderElementResponseDto>) {
		this.id = props.id;
		this.type = props.type;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}
}
