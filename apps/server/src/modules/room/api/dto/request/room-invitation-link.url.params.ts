import { ApiProperty } from '@nestjs/swagger';
import { PrivacyProtect } from '@shared/controller/validator';
import { IsMongoId } from 'class-validator';

export class RoomInvitationLinkUrlParams {
	@PrivacyProtect()
	@IsMongoId()
	@ApiProperty()
	roomInvitationLinkId!: string;
}
