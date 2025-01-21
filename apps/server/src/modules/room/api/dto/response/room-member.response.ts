import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '@shared/domain/interface';

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
