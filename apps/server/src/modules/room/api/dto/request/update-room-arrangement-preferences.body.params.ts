import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { RoomArrangementRevisionBodyParams } from './room-arrangement-revision.body.params';

export class UpdateRoomArrangementPreferencesBodyParams extends RoomArrangementRevisionBodyParams {
	@IsBoolean()
	@ApiProperty({ description: 'Whether deleting a group asks for confirmation.', required: true, nullable: false })
	confirmGroupDeletion!: boolean;
}
