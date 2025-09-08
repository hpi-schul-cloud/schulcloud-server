import { RoomRole, RoleName } from '@modules/role';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsMongoId } from 'class-validator';

export type AssignableRoomRole = Exclude<RoomRole, RoleName.ROOMOWNER>;
export enum AssignableRoomRoleEnum {
	ROOMADMIN = RoleName.ROOMADMIN,
	ROOMEDITOR = RoleName.ROOMEDITOR,
	ROOMVIEWER = RoleName.ROOMVIEWER,
}

export class ChangeRoomRoleBodyParams {
	@ApiProperty({
		description: 'The IDs of the users',
		required: true,
	})
	@IsArray()
	@IsMongoId({ each: true })
	public userIds!: string[];

	@ApiProperty({
		description: 'The role to assign to the users. Must be a Room Role role other than ROOMOWNER.',
		required: true,
		enum: AssignableRoomRoleEnum,
	})
	@IsEnum(AssignableRoomRoleEnum)
	public roleName!: AssignableRoomRole;
}
