import { ApiProperty } from '@nestjs/swagger';

export class UsersByRoleCountResponse {
	@ApiProperty()
	roleName: string;

	@ApiProperty()
	userCount: number;

	constructor(usersByRole: UsersByRoleCountResponse) {
		this.roleName = usersByRole.roleName;
		this.userCount = usersByRole.userCount;
	}
}
