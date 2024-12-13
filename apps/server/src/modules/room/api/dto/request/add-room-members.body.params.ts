import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RoleName, RoomRoleArray } from '@shared/domain/interface';

class UserIdAndRole {
	@ApiProperty({
		description: 'The ID of the user',
		required: true,
	})
	@IsMongoId()
	userId!: string;

	@ApiProperty({
		description: 'The role of the user',
		required: true,
		enum: RoomRoleArray,
	})
	@IsString()
	roleName!: RoleName.ROOMADMIN | RoleName.ROOMEDITOR | RoleName.ROOMVIEWER;
}

export class AddRoomMembersBodyParams {
	@ApiProperty({
		description: 'Array of userIds and their roles inside of the room',
		required: true,
		type: [UserIdAndRole],
	})
	@ValidateNested({ each: true })
	@Type(() => UserIdAndRole)
	userIdsAndRoles!: UserIdAndRole[];
}
