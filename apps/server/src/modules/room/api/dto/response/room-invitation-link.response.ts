import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';

export class RoomInvitationLinkResponse {
	@ApiProperty()
	id: EntityId;

	@ApiProperty()
	roomId: EntityId;

	@ApiProperty()
	title: string;

	@ApiProperty()
	restrictedToCreatorSchool: boolean;

	@ApiProperty()
	isOnlyForTeachers: boolean;

	@ApiPropertyOptional({ type: Date })
	activeUntil?: Date;

	@ApiProperty()
	requiresConfirmation: boolean;

	@ApiProperty()
	creatorUserId: EntityId;

	@ApiProperty()
	creatorSchoolId: EntityId;

	constructor(roomInvitationLink: RoomInvitationLinkResponse) {
		this.id = roomInvitationLink.id;
		this.roomId = roomInvitationLink.roomId;
		this.title = roomInvitationLink.title;
		this.restrictedToCreatorSchool = roomInvitationLink.restrictedToCreatorSchool;
		this.isOnlyForTeachers = roomInvitationLink.isOnlyForTeachers;
		this.activeUntil = roomInvitationLink.activeUntil;
		this.requiresConfirmation = roomInvitationLink.requiresConfirmation;
		this.creatorUserId = roomInvitationLink.creatorUserId;
		this.creatorSchoolId = roomInvitationLink.creatorSchoolId;
	}
}
