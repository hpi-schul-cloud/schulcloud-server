import { ContentElementType } from '../cards-api-client';
import { TimestampResponseDto } from './timestamp-response.dto';

export class CollaborativeTextEditorElementResponseDto {
	public id: string;

	public type: ContentElementType;

	public timestamps: TimestampResponseDto;

	public content: object;

	constructor(id: string, type: ContentElementType, content: object, timestamps: TimestampResponseDto) {
		this.id = id;
		this.type = type;
		this.timestamps = timestamps;
		this.content = content;
	}
}
