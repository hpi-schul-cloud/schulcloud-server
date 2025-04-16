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

	constructor(room: RoomInvitationLinkResponse) {
		this.id = room.id;
		this.roomId = room.roomId;
		this.title = room.title;
		this.restrictedToCreatorSchool = room.restrictedToCreatorSchool;
		this.isOnlyForTeachers = room.isOnlyForTeachers;
		this.activeUntil = room.activeUntil;
		this.requiresConfirmation = room.requiresConfirmation;
		this.creatorUserId = room.creatorUserId;
		this.creatorSchoolId = room.creatorSchoolId;
	}
}
