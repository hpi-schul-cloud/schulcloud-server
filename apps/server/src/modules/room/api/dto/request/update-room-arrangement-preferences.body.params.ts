import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, ValidateIf } from 'class-validator';
import { RoomArrangementRevisionBodyParams } from './room-arrangement-revision.body.params';

export class UpdateRoomArrangementPreferencesBodyParams extends RoomArrangementRevisionBodyParams {
	// may be omitted, but an explicit null is rejected; required when groupingHintDismissed is missing,
	// so that a request without any preference fails with a validation error
	@ValidateIf(
		(params: UpdateRoomArrangementPreferencesBodyParams) =>
			params.confirmGroupDeletion !== undefined || params.groupingHintDismissed === undefined
	)
	@IsBoolean()
	@ApiPropertyOptional({
		description: 'Whether deleting a group asks for confirmation. At least one preference is required.',
	})
	confirmGroupDeletion?: boolean;

	// may be omitted, but an explicit null is rejected
	@ValidateIf((_params: UpdateRoomArrangementPreferencesBodyParams, value: unknown) => value !== undefined)
	@IsBoolean()
	@ApiPropertyOptional({
		description:
			'Whether the user dismissed the first-run hint about room groups. At least one preference is required.',
	})
	groupingHintDismissed?: boolean;
}
