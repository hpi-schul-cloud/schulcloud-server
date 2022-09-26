import { ApiProperty } from '@nestjs/swagger';

export class ConsentSessionResponse {
	constructor(response: ConsentSessionResponse) {
		this.client_id = response.client_id;
		this.client_name = response.client_name;
		this.challenge = response.challenge;
	}

	@ApiProperty()
	client_id?: string;

	@ApiProperty()
	client_name?: string;

	@ApiProperty()
	challenge?: string;
}
