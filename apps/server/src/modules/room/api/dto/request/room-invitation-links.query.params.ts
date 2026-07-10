import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class RoomInvitationLinksQueryParams {
	@ApiProperty({
		description: 'Array of room invitation link ids',
		type: [String],
	})
	@IsMongoId({ each: true })
	roomInvitationLinkIds!: string[] | string;
}
