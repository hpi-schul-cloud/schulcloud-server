import { ApiProperty } from '@nestjs/swagger';
import { TimestampsResponse } from '../timestamps.response';

export class TextElementResponse {
	constructor({ id, text, timestamps }: TextElementResponse) {
		this.id = id;
		this.text = text;
		this.timestamps = timestamps;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty()
	text: string;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
