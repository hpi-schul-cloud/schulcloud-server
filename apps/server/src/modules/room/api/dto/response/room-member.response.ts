import { RoleName } from '@modules/role';
import { ApiProperty } from '@nestjs/swagger';

export class RoomMemberResponse {
	@ApiProperty()
	public firstName!: string;

	@ApiProperty()
	public lastName!: string;

	@ApiProperty({ enum: RoleName, enumName: 'RoleName' })
	public roomRoleName!: RoleName;

	@ApiProperty({ enum: RoleName, enumName: 'RoleName', isArray: true })
	public schoolRoleNames!: RoleName[];

	@ApiProperty()
	public schoolName!: string;

	@ApiProperty()
	public userId!: string;

	constructor(props: RoomMemberResponse) {
		this.userId = props.userId;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.roomRoleName = props.roomRoleName;
		this.schoolRoleNames = props.schoolRoleNames;
		this.schoolName = props.schoolName;
	}
}
