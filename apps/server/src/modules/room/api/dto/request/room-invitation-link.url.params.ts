import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class RoomInvitationLinkUrlParams {
	@IsMongoId()
	@ApiProperty()
	public roomInvitationLinkId!: string;
}
