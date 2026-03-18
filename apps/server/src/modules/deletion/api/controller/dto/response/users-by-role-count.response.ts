import { ApiProperty } from '@nestjs/swagger';

export class UsersByRoleCountResponse {
	@ApiProperty()
	public roleName: string;

	@ApiProperty()
	public userCount: number;

	constructor(usersByRole: UsersByRoleCountResponse) {
		this.roleName = usersByRole.roleName;
		this.userCount = usersByRole.userCount;
	}
}
