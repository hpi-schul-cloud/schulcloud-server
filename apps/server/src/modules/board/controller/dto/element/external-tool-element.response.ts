import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain';
import { TimestampsResponse } from '../timestamps.response';

export class ExternalToolElementContent {
	constructor(props: ExternalToolElementContent) {
		this.contextExternalToolId = props.contextExternalToolId;
	}

	@ApiPropertyOptional()
	contextExternalToolId?: string;
}

export class ExternalToolElementResponse {
	constructor(props: ExternalToolElementResponse) {
		this.id = props.id;
		this.type = props.type;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.EXTERNAL_TOOL;

	@ApiProperty()
	content: ExternalToolElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
