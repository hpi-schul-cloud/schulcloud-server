import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '@shared/domain/interface';

export class RoomMemberResponse {
	@ApiProperty()
	firstName!: string;

	@ApiProperty()
	lastName!: string;

	@ApiProperty()
	roleName!: RoleName;

	@ApiProperty()
	schoolName!: string;

	@ApiProperty()
	userId!: string;

	constructor(props: RoomMemberResponse) {
		this.userId = props.userId;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.roleName = props.roleName;
		this.schoolName = props.schoolName;
	}
}

export class RoomMemberListResponse {
	constructor(data: RoomMemberResponse[]) {
		this.data = data;
	}

	@ApiProperty({ type: [RoomMemberResponse] })
	data: RoomMemberResponse[];
}
