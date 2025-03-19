import { ApiProperty } from '@nestjs/swagger';
import { MediaSourceResponse } from './media-source.response';

export class MediaSourceListResponse {
	@ApiProperty({ type: [MediaSourceResponse] })
	responses: MediaSourceResponse[];

	constructor(responses: MediaSourceResponse[]) {
		this.responses = responses;
	}
}
