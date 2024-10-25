import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '@shared/domain/interface';

export class RoomParticipantResponse {
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

	constructor(props: RoomParticipantResponse) {
		this.userId = props.userId;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.roleName = props.roleName;
		this.schoolName = props.schoolName;
	}
}

export class RoomParticipantListResponse {
	constructor(data: RoomParticipantResponse[]) {
		this.data = data;
	}

	@ApiProperty({ type: [RoomParticipantResponse] })
	data: RoomParticipantResponse[];
}
