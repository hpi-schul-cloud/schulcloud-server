import { ApiProperty } from '@nestjs/swagger';

export class MessageOrigin {
	constructor(message_id: number, page: string) {
		this.message_id = message_id;
		this.page = page;
	}

	@ApiProperty()
	message_id: number;

	@ApiProperty()
	page: string;
}
