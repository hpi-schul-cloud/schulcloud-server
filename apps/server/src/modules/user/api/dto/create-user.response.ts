import { ApiProperty } from '@nestjs/swagger';

export class SuccessfulResponse {
	constructor(successful: boolean) {
		this.successful = successful;
	}

	@ApiProperty()
	successful: boolean;
}
