import { RoleName } from '@modules/role';
import { ApiProperty } from '@nestjs/swagger';

export class RoomMemberResponse {
	@ApiProperty()
	public firstName!: string;

	@ApiProperty()
	public lastName!: string;

	@ApiProperty()
	public roomRoleName!: RoleName;

	@ApiProperty()
	public schoolRoleName!: RoleName;

	@ApiProperty()
	public schoolName!: string;

	@ApiProperty()
	public userId!: string;

	constructor(props: RoomMemberResponse) {
		this.userId = props.userId;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.roomRoleName = props.roomRoleName;
		this.schoolRoleName = props.schoolRoleName;
		this.schoolName = props.schoolName;
	}
}
