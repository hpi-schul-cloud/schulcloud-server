import { ApiProperty } from '@nestjs/swagger';
import { RoomRole } from '@shared/domain/interface';

export class RoomRoleResponse {
	@ApiProperty()
	public roomRoleName!: RoomRole;

	constructor(roomRoleName: RoomRole) {
		this.roomRoleName = roomRoleName;
	}
}
