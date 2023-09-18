import { ApiProperty } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain';
import { TimestampsResponse } from '../timestamps.response';

export class ExternalToolElementResponse {
	constructor(props: ExternalToolElementResponse) {
		this.id = props.id;
		this.timestamps = props.timestamps;
		this.type = props.type;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.EXTERNAL_TOOL;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
