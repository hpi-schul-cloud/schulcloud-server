import { ApiProperty } from '@nestjs/swagger';
import { PrivacyProtect } from '@shared/controller/validator';
import { IsMongoId } from 'class-validator';

export class RoomInvitationLinksQueryParams {
	@PrivacyProtect()
	@ApiProperty({
		description: 'Array of room invitation link ids',
		type: [String],
	})
	@IsMongoId({ each: true })
	roomInvitationLinkIds!: string[] | string;
}
