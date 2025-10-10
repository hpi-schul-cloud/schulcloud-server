import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';

export class RoomInvitationLinkResponse {
	@ApiProperty()
	public id: EntityId;

	@ApiProperty()
	public roomId: EntityId;

	@ApiProperty()
	public title: string;

	@ApiProperty()
	public restrictedToCreatorSchool: boolean;

	@ApiProperty()
	public isUsableByExternalPersons: boolean;

	@ApiProperty()
	public isUsableByStudents: boolean;

	@ApiPropertyOptional({ type: Date })
	public activeUntil?: Date;

	@ApiProperty()
	public requiresConfirmation: boolean;

	@ApiProperty()
	public creatorUserId: EntityId;

	@ApiProperty()
	public creatorSchoolId: EntityId;

	constructor(roomInvitationLink: RoomInvitationLinkResponse) {
		this.id = roomInvitationLink.id;
		this.roomId = roomInvitationLink.roomId;
		this.title = roomInvitationLink.title;
		this.restrictedToCreatorSchool = roomInvitationLink.restrictedToCreatorSchool;
		this.isUsableByExternalPersons = roomInvitationLink.isUsableByExternalPersons;
		this.isUsableByStudents = roomInvitationLink.isUsableByStudents;
		this.activeUntil = roomInvitationLink.activeUntil;
		this.requiresConfirmation = roomInvitationLink.requiresConfirmation;
		this.creatorUserId = roomInvitationLink.creatorUserId;
		this.creatorSchoolId = roomInvitationLink.creatorSchoolId;
	}
}
