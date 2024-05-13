import { ApiProperty } from '@nestjs/swagger';
import { Message } from './message';

export class AlertResponse {
	constructor(data: Message[]) {
		this.data = data;
	}

	@ApiProperty({ type: [Message] })
	data: Message[];
}
