import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';

export class UserInfoResponse {
	constructor({ id, firstName, lastName }: UserInfoResponse) {
		this.id = id;
		this.firstName = firstName;
		this.lastName = lastName;
	}

	@ApiProperty({
		pattern: bsonStringPattern,
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
