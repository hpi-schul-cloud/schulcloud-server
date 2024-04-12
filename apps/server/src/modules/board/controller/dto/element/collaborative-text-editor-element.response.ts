import { ApiProperty } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain/domainobject';
import { TimestampsResponse } from '../timestamps.response';

export class CollaborativeTextEditorElementResponse {
	constructor(props: CollaborativeTextEditorElementResponse) {
		this.id = props.id;
		this.type = props.type;
		this.timestamps = props.timestamps;
		this.content = props.content;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.COLLABORATIVE_TEXT_EDITOR;

	@ApiProperty()
	timestamps: TimestampsResponse;

	@ApiProperty()
	content: object;
}
