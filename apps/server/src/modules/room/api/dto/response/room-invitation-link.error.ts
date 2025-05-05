/* istanbul ignore file */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomInvitationLinkValidationError } from '../../type/room-invitation-link-validation-error.enum';
import { BusinessError } from '@shared/common/error';
import { HttpStatus } from '@nestjs/common';

export class RoomInvitationLinkError extends BusinessError {
	@ApiProperty({
		description: 'The error code.',
		enum: RoomInvitationLinkValidationError,
		enumName: 'RoomInvitationLinkValidationError',
	})
	public readonly validationMessage: RoomInvitationLinkValidationError;

	@ApiPropertyOptional({ description: 'The error details.' })
	public readonly schoolName?: string;

	constructor(validationMessage: RoomInvitationLinkValidationError, schoolName?: string) {
		super(
			{
				type: 'ROOM_INVITATION_LINK_VALIDATION_ERROR',
				title: 'API Room Invitation Link Validation Error',
				defaultMessage: 'API Room Invitation Link validation failed, see validationMessage for details',
			},
			HttpStatus.BAD_REQUEST
		);
		this.validationMessage = validationMessage;
		this.schoolName = schoolName;
	}
}
