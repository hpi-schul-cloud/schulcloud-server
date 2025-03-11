import { RoomRole } from '@modules/role';
import { ApiProperty } from '@nestjs/swagger';

export class RoomRoleResponse {
	@ApiProperty()
	public roomRoleName!: RoomRole;

	constructor(roomRoleName: RoomRole) {
		this.roomRoleName = roomRoleName;
	}
}
