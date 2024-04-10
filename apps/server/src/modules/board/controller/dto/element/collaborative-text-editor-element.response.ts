import { ApiProperty } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain/domainobject';
import { TimestampsResponse } from '../timestamps.response';

export class CollaborativeTextEditorElementContent {
	constructor(props: CollaborativeTextEditorElementContent) {
		this.editorId = props.editorId;
	}

	@ApiProperty({ type: String, required: true })
	editorId: string;
}

export class CollaborativeTextEditorElementResponse {
	constructor(props: CollaborativeTextEditorElementResponse) {
		this.id = props.id;
		this.type = props.type;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.COLLABORATIVE_TEXT_EDITOR;

	@ApiProperty()
	content: CollaborativeTextEditorElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
