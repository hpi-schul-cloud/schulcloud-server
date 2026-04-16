import { RoleName } from '@modules/role';
import { ApiProperty } from '@nestjs/swagger';

export class RoomMember {
	@ApiProperty()
	public userId!: string;

	@ApiProperty()
	public firstName!: string;

	@ApiProperty()
	public lastName!: string;

	@ApiProperty()
	public roomRoleId!: string;

	@ApiProperty({ enum: RoleName, enumName: 'RoleName' })
	public roomRoleName!: RoleName;

	@ApiProperty()
	public schoolId!: string;

	@ApiProperty({ enum: RoleName, isArray: true, enumName: 'RoleName' })
	public schoolRoleNames!: RoleName[];

	constructor(props: RoomMember) {
		this.userId = props.userId;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.roomRoleId = props.roomRoleId;
		this.roomRoleName = props.roomRoleName;
		this.schoolId = props.schoolId;
		this.schoolRoleNames = props.schoolRoleNames;
	}
}
