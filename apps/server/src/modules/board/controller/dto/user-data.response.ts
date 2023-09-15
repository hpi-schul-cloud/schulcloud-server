import { ApiProperty } from '@nestjs/swagger';
import { BoardRoles, UserRoleEnum } from '@shared/domain';

export class UserDataResponse {
	constructor({ userId, firstName, lastName }: UserDataResponse) {
		this.userId = userId;
		this.firstName = firstName;
		this.lastName = lastName;
	}

	@ApiProperty()
	firstName!: string;

	@ApiProperty()
	lastName!: string;

	@ApiProperty()
	userId!: string;
}
