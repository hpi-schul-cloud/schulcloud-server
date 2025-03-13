import { RoleName } from '@modules/role';
import { ApiProperty } from '@nestjs/swagger';

export class GroupUserResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	firstName: string;

	@ApiProperty()
	lastName: string;

	@ApiProperty({ enum: RoleName, enumName: 'RoleName' })
	role: RoleName;

	constructor(user: GroupUserResponse) {
		this.id = user.id;
		this.firstName = user.firstName;
		this.lastName = user.lastName;
		this.role = user.role;
	}
}
