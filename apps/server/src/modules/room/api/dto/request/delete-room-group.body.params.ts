import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, ValidateIf } from 'class-validator';
import { RoomArrangementRevisionBodyParams } from './room-arrangement-revision.body.params';

export class DeleteRoomGroupBodyParams extends RoomArrangementRevisionBodyParams {
	// may be omitted, but an explicit null is rejected (@IsOptional would let null through)
	@ValidateIf((_params: DeleteRoomGroupBodyParams, value: unknown) => value !== undefined)
	@IsBoolean()
	@ApiPropertyOptional({
		description: 'When true, future group deletions are no longer confirmed. Saved together with the deletion.',
	})
	disableFutureConfirmation?: boolean;
}
