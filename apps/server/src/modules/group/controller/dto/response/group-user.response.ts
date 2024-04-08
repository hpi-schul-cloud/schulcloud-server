import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '@shared/domain/interface';

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
