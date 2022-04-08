import { ApiProperty } from '@nestjs/swagger';

// Only used to check if account exists, thus no properties needed
export class AccountResponse {
	constructor(id: string) {
		this.id = id;
	}

	@ApiProperty({
		description: 'Id of the account',
		pattern: '^[a-f0-9]{24}$',
	})
	id: string;
}
