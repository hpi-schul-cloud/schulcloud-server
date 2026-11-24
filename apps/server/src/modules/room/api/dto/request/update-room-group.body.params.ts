import { ApiPropertyOptional } from '@nestjs/swagger';
import { PrivacyProtect } from '@shared/controller/validator';
import { IsBoolean, IsString, MaxLength, ValidateIf } from 'class-validator';
import { RoomArrangementRevisionBodyParams } from './room-arrangement-revision.body.params';

export class UpdateRoomGroupBodyParams extends RoomArrangementRevisionBodyParams {
	// name is required when collapsed is missing, so that a request without any change fails with a validation error
	@ValidateIf((params: UpdateRoomGroupBodyParams) => params.name !== undefined || params.collapsed === undefined)
	@PrivacyProtect()
	@IsString()
	@MaxLength(1000)
	@ApiPropertyOptional({
		description:
			'The new name of the group. It is trimmed and NFC-normalized and must have 1 to 100 characters. At least one of name and collapsed is required.',
	})
	name?: string;

	// may be omitted, but an explicit null is rejected (@IsOptional would let null through)
	@ValidateIf((_params: UpdateRoomGroupBodyParams, value: unknown) => value !== undefined)
	@IsBoolean()
	@ApiPropertyOptional({
		description:
			'Whether the rooms of the group are hidden in the overview. At least one of name and collapsed is required.',
	})
	collapsed?: boolean;
}
