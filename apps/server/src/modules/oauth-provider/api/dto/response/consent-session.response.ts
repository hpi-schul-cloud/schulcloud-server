import { ApiProperty } from '@nestjs/swagger';

export class ConsentSessionResponse {
	constructor(props: ConsentSessionResponse) {
		this.client_id = props.client_id;
		this.client_name = props.client_name;
		this.challenge = props.challenge;
	}

	@ApiProperty({ description: 'The id of the client.' })
	client_id: string;

	@ApiProperty({ description: 'The name of the client.' })
	client_name: string;

	@ApiProperty({ description: 'The id/challenge of the consent authorization request.' })
	challenge: string;
}
