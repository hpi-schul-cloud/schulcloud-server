import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsMongoId, ValidateIf } from 'class-validator';
import { RoomArrangementRevisionBodyParams } from './room-arrangement-revision.body.params';

export class MoveRoomsInArrangementBodyParams extends RoomArrangementRevisionBodyParams {
	@IsArray()
	@ArrayMinSize(1)
	@ArrayMaxSize(500)
	@ArrayUnique()
	@IsMongoId({ each: true })
	@ApiProperty({
		description: 'The rooms to move. They are appended to the target section in this order.',
		type: [String],
		required: true,
		nullable: false,
	})
	roomIds!: string[];

	@ValidateIf((_params: MoveRoomsInArrangementBodyParams, value: unknown) => value !== null)
	@IsMongoId()
	@ApiProperty({
		description: 'The group the rooms are moved to, or null for ungrouped.',
		type: String,
		required: true,
		nullable: true,
	})
	targetGroupId!: string | null;
}
