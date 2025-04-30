import { ApiProperty } from '@nestjs/swagger';
import { RoomInvitationLinkValidationError } from '../../type/room-invitation-link-validation-error.enum';

export class RoomInvitationLinkError {
	@ApiProperty({ enum: RoomInvitationLinkValidationError, enumName: 'RoomInvitationLinkValidationError' })
	public error: RoomInvitationLinkValidationError;

	constructor(error: RoomInvitationLinkValidationError) {
		this.error = error;
	}
}
