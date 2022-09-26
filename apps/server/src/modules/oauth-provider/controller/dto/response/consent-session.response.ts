import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class ConsentSessionResponse {
	constructor(response: ConsentSessionResponse) {
		this.client_id = response.client_id;
		this.client_name = response.client_name;
		this.challenge = response.challenge;
	}

	@IsOptional()
	@ApiProperty({ description: 'The id of the client.' })
	client_id?: string;

	@ApiProperty({ description: 'The name of the client.' })
	client_name?: string;

	@ApiProperty({ description: 'The id/challenge of the consent authorization request.' })
	challenge?: string;
}
