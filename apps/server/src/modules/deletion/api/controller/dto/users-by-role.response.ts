import { ApiProperty } from '@nestjs/swagger';

export class UsersByRoleResponse {
	@ApiProperty()
	roleName: string;

	@ApiProperty()
	userCount: number;

	constructor(usersByRole: UsersByRoleResponse) {
		this.roleName = usersByRole.roleName;
		this.userCount = usersByRole.userCount;
	}
}
