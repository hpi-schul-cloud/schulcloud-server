import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId } from 'class-validator';
import { RoomArrangementRevisionBodyParams } from './room-arrangement-revision.body.params';

export class UpdateRoomGroupOrderBodyParams extends RoomArrangementRevisionBodyParams {
	@IsArray()
	@IsMongoId({ each: true })
	@ApiProperty({
		description: 'All group ids of the arrangement in their new order.',
		type: [String],
		required: true,
		nullable: false,
	})
	groupIds!: string[];
}
