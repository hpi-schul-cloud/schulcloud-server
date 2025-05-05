/* istanbul ignore file */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoomInvitationLinkValidationError } from '../../type/room-invitation-link-validation-error.enum';
import { BusinessError } from '@shared/common/error';
import { HttpStatus } from '@nestjs/common';

export class RoomInvitationLinkError extends BusinessError {
	@ApiPropertyOptional({
		description: 'The error details.',
		enum: RoomInvitationLinkValidationError,
		enumName: 'RoomInvitationLinkValidationError',
	})
	public readonly details?: {
		validationMessage: RoomInvitationLinkValidationError;
		schoolName?: string;
	};

	constructor(
		validationMessage: RoomInvitationLinkValidationError,
		schoolName?: string,
		code = HttpStatus.BAD_REQUEST
	) {
		super(
			{
				type: 'ROOM_INVITATION_LINK_VALIDATION_ERROR',
				title: 'Room Invitation link validation error',
				defaultMessage: 'room invitation link is invalid',
			},
			code
		);
		this.details = {
			validationMessage: validationMessage,
			schoolName: schoolName,
		};
	}
}
