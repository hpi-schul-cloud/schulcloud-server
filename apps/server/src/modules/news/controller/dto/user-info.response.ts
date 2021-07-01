import { ApiProperty } from '@nestjs/swagger';

export class UserInfoResponse {
	@ApiProperty({
		pattern: '[a-f0-9]{24}',
		description: 'The id of the User entity',
	})
	id: string;

	@ApiProperty({
		description: 'First name of the user',
	})
	firstName: string;

	@ApiProperty({
		description: 'Last name of the user',
	})
	lastName: string;
}
