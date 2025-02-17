import { ApiProperty } from '@nestjs/swagger';
import { MediaSourceDataFormat } from '../../enum';

export class MediaSourceResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string | undefined;

	@ApiProperty()
	format: MediaSourceDataFormat | undefined;

	constructor(response: MediaSourceResponse) {
		this.id = response.id;
		this.name = response.name;
		this.format = response.format;
	}
}
