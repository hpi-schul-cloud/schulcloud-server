import { ApiProperty } from '@nestjs/swagger';

export class UserInfoResponse {
	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty()
	firstName: string;

	@ApiProperty()
	lastName: string;
}
