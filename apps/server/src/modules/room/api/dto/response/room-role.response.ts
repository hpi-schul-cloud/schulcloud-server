import { RoomRole } from '@modules/role';
import { ApiProperty } from '@nestjs/swagger';

export class RoomRoleResponse {
	@ApiProperty()
	roomRoleName!: RoomRole;

	constructor(roomRoleName: RoomRole) {
		this.roomRoleName = roomRoleName;
	}
}
