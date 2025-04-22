import { ApiProperty } from '@nestjs/swagger';
import { RoomInvitationLinkValidationResult } from '../../type/room-invitation-link-validation-result.enum';
import { IsEnum } from 'class-validator';

export class RoomInvitationLinkUseLinkResponse {
	@ApiProperty({ enum: RoomInvitationLinkValidationResult, enumName: 'RoomInvitationLinkValidationResult' })
	@IsEnum(RoomInvitationLinkValidationResult)
	public validationResult!: RoomInvitationLinkValidationResult;

	constructor(room: RoomInvitationLinkUseLinkResponse) {
		this.validationResult = room.validationResult;
	}
}
