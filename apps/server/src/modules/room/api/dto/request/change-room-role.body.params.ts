import { ApiProperty } from '@nestjs/swagger';
import { RoleName, RoomRole } from '@shared/domain/interface';
import { IsArray, IsMongoId } from 'class-validator';

export type AssignableRoomRole = Exclude<RoomRole, RoleName.ROOMOWNER>;

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
		enum: RoleName,
	})
	public roleName!: AssignableRoomRole;
}
