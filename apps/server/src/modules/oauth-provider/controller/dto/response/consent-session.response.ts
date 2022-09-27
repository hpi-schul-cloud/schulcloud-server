import { ApiProperty } from '@nestjs/swagger';

export class ConsentSessionResponse {
	constructor(clientId: string | undefined, clientName: string | undefined, challenge: string | undefined) {
		this.client_id = clientId;
		this.client_name = clientName;
		this.challenge = challenge;
	}

	@ApiProperty()
	client_id?: string;

	@ApiProperty()
	client_name?: string;

	@ApiProperty()
	challenge?: string;
}
