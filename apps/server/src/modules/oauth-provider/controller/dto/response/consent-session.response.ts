import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class ConsentSessionResponse {
	constructor(clientId: string | undefined, clientName: string | undefined, challenge: string | undefined) {
		this.client_id = clientId;
		this.client_name = clientName;
		this.challenge = challenge;
	}

	@IsOptional()
	@ApiProperty({ description: 'The id of the client.' })
	client_id?: string;

	@ApiProperty({ description: 'The name of the client.' })
	client_name?: string;

	@ApiProperty({ description: 'The id/challenge of the consent authorization request.' })
	challenge?: string;
}
