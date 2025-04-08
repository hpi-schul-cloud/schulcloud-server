import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { ContentElementType } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';

export class ExternalToolElementContent {
	constructor(props: ExternalToolElementContent) {
		this.contextExternalToolId = props.contextExternalToolId;
	}

	@ApiProperty({ type: String, required: true, nullable: true })
	contextExternalToolId: string | null;
}

export class ExternalToolElementResponse {
	constructor(props: ExternalToolElementResponse) {
		this.id = props.id;
		this.type = props.type;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}

	@ApiProperty({ pattern: bsonStringPattern })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.EXTERNAL_TOOL;

	@ApiProperty()
	content: ExternalToolElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
