import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, ValidateIf } from 'class-validator';
import { RoomArrangementRevisionBodyParams } from './room-arrangement-revision.body.params';

export class MoveRoomInArrangementBodyParams extends RoomArrangementRevisionBodyParams {
	@IsMongoId()
	@ApiProperty({ description: 'The id of the room to move.', required: true, nullable: false })
	roomId!: string;

	@ValidateIf((_params: MoveRoomInArrangementBodyParams, value: unknown) => value !== null)
	@IsMongoId()
	@ApiProperty({
		description: 'The group the room is currently in, or null for ungrouped.',
		type: String,
		required: true,
		nullable: true,
	})
	sourceGroupId!: string | null;

	@ValidateIf((_params: MoveRoomInArrangementBodyParams, value: unknown) => value !== null)
	@IsMongoId()
	@ApiProperty({
		description: 'The group the room is moved to, or null for ungrouped.',
		type: String,
		required: true,
		nullable: true,
	})
	targetGroupId!: string | null;

	@ValidateIf((_params: MoveRoomInArrangementBodyParams, value: unknown) => value !== null)
	@IsMongoId()
	@ApiProperty({
		description: 'The room in the target section the moved room is placed before, or null to append it.',
		type: String,
		required: true,
		nullable: true,
	})
	beforeRoomId!: string | null;
}
