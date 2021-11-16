import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserInfoResponse {
	constructor({ id, firstName, lastName }: UserInfoResponse) {
		this.id = id;
		this.firstName = firstName;
		this.lastName = lastName;
	}

	@ApiProperty({
		pattern: '[a-f0-9]{24}',
		description: 'The id of the User entity',
	})
	id: string;

	@ApiPropertyOptional({
		description: 'First name of the user',
	})
	firstName?: string;

	@ApiPropertyOptional({
		description: 'Last name of the user',
	})
	lastName?: string;
}
