import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { RoomArrangementRevisionBodyParams } from './room-arrangement-revision.body.params';

export class UpdateRoomGroupsCollapsedBodyParams extends RoomArrangementRevisionBodyParams {
	@IsBoolean()
	@ApiProperty({ description: 'Collapse (true) or expand (false) all groups.', required: true, nullable: false })
	collapsed!: boolean;
}
