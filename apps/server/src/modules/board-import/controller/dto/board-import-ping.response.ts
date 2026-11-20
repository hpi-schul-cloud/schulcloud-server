import { ApiProperty } from '@nestjs/swagger';

export class BoardImportPingResponse {
	@ApiProperty()
	message: string;

	constructor(message: string) {
		this.message = message;
	}
}
