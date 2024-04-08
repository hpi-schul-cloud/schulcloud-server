import { ApiProperty } from '@nestjs/swagger';
import { TimestampsResponse } from '../../dto';

export class MediaExternalToolElementContent {
	@ApiProperty()
	contextExternalToolId: string;

	constructor(props: MediaExternalToolElementContent) {
		this.contextExternalToolId = props.contextExternalToolId;
	}
}

export class MediaExternalToolElementResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	content: MediaExternalToolElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;

	constructor(props: MediaExternalToolElementResponse) {
		this.id = props.id;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}
}
