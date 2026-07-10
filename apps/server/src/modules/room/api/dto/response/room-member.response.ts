import { RoleName } from '@modules/role';
import {
	RoomMemberOperation,
	RoomMemberOperationValues,
} from '@modules/room-membership/authorization/room-member.rule';
import { ApiProperty } from '@nestjs/swagger';

export class RoomMemberResponse {
	@ApiProperty()
	firstName!: string;

	@ApiProperty()
	lastName!: string;

	@ApiProperty({ enum: RoleName, enumName: 'RoleName' })
	roomRoleName!: RoleName;

	@ApiProperty({ enum: RoleName, enumName: 'RoleName', isArray: true })
	schoolRoleNames!: RoleName[];

	@ApiProperty()
	schoolId!: string;

	@ApiProperty()
	schoolName!: string;

	@ApiProperty()
	userId!: string;

	@ApiProperty({
		type: 'object',
		properties: RoomMemberOperationValues.reduce((acc, op) => {
			acc[op] = { type: 'boolean' };
			return acc;
		}, {}),
		additionalProperties: false,
		required: [...RoomMemberOperationValues],
	})
	allowedOperations: Record<RoomMemberOperation, boolean>;

	constructor(props: RoomMemberResponse) {
		this.userId = props.userId;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.roomRoleName = props.roomRoleName;
		this.schoolRoleNames = props.schoolRoleNames;
		this.schoolName = props.schoolName;
		this.schoolId = props.schoolId;
		this.allowedOperations = props.allowedOperations;
	}
}
