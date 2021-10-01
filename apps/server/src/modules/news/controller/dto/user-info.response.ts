import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserInfoResponse {
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
