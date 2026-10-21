import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

// Unlike $, the final assertion also rejects trailing line breaks.
const ROOM_INVITATION_CREDENTIAL_PATTERN = /^(?:[A-Za-z0-9_-]{43}|[a-fA-F0-9]{24})(?![\s\S])/;

export class UseRoomInvitationLinkUrlParams {
	@Matches(ROOM_INVITATION_CREDENTIAL_PATTERN)
	@ApiProperty({
		description: 'Invitation token (43 base64url characters), or the ObjectId of a legacy invitation without a token',
		pattern: ROOM_INVITATION_CREDENTIAL_PATTERN.source,
	})
	roomInvitationLinkId!: string;
}
