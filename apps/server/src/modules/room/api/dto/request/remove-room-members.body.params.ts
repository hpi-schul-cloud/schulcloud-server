import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId } from 'class-validator';

export class RemoveRoomMembersBodyParams {
	@ApiProperty({
		description: 'The IDs of the users',
		required: true,
	})
	@IsArray()
	@IsMongoId({ each: true })
	userIds!: string[];
}
