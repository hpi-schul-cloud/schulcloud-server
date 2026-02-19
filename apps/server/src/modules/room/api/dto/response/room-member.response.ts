import { RoleName } from '@modules/role';
import {
	RoomMemberOperation,
	RoomMemberOperationValues,
} from '@modules/room-membership/authorization/room-member.rule';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

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
	public schoolId!: string;

	@ApiProperty()
	public schoolName!: string;

	@ApiProperty()
	public userId!: string;

	@ApiProperty({
		type: 'object',
		properties: RoomMemberOperationValues.reduce((acc, op) => {
			acc[op] = { type: 'boolean' };
			return acc;
		}, {}),
		additionalProperties: false,
		required: [...RoomMemberOperationValues],
	})
	@IsIn(RoomMemberOperationValues)
	public allowedOperations: Record<RoomMemberOperation, boolean>;

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
