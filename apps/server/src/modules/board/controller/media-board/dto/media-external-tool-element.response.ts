import { ApiProperty } from '@nestjs/swagger';
import { TimestampsResponse } from '../../dto';

export class MediaExternalToolElementContent {
	@ApiProperty({ description: 'The id of the context external tool' })
	contextExternalToolId: string;

	constructor(props: MediaExternalToolElementContent) {
		this.contextExternalToolId = props.contextExternalToolId;
	}
}

export class MediaExternalToolElementResponse {
	@ApiProperty({ description: 'The id of the media external tool element' })
	id: string;

	@ApiProperty({ description: 'The content of the media external tool element' })
	content: MediaExternalToolElementContent;

	@ApiProperty({ description: 'The timestamps of the media external tool element' })
	timestamps: TimestampsResponse;

	constructor(props: MediaExternalToolElementResponse) {
		this.id = props.id;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}
}
