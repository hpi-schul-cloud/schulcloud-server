import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomInvitationLinkValidationResult } from '../../type/room-invitation-link-validation-result.enum';
import { IsEnum, IsString } from 'class-validator';

export class RoomInvitationLinkUseLinkResponse {
	@ApiProperty({ enum: RoomInvitationLinkValidationResult, enumName: 'RoomInvitationLinkValidationResult' })
	@IsEnum(RoomInvitationLinkValidationResult)
	public validationResult!: RoomInvitationLinkValidationResult;

	@ApiPropertyOptional()
	@IsString()
	public redirectUrl?: string;

	constructor(room: RoomInvitationLinkUseLinkResponse) {
		this.validationResult = room.validationResult;
		this.redirectUrl = room.redirectUrl;
	}
}
