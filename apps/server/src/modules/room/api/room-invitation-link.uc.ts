import { AuthorizationService } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { RoomMembershipService } from '@modules/room-membership';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { EntityId } from '@shared/domain/types';
import { RoomInvitationLink, RoomInvitationLinkUpdateProps } from '../domain/do/room-invitation-link.do';
import { RoomConfig } from '../room.config';
import { RoomInvitationLinkValidationResult } from './type/room-invitation-link-validation-result.enum';
import { RoomInvitationLinkService } from '../domain/service/room-invitation-link.service';
import { CreateRoomInvitationLinkBodyParams } from './dto/request/create-room-invitation-link.body.params';

type UseLinkResponse = {
	validationResult: RoomInvitationLinkValidationResult;
	redirectUrl?: string;
};
@Injectable()
export class RoomInvitationLinkUc {
	constructor(
		private readonly configService: ConfigService<RoomConfig, true>,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly roomInvitationLinkService: RoomInvitationLinkService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async createLink(userId: EntityId, props: CreateRoomInvitationLinkBodyParams): Promise<RoomInvitationLink> {
		this.checkFeatureEnabled();

		const user = await this.authorizationService.getUserWithPermissions(userId);

		// TODO: check permissions
		const roomInvitationLink = await this.roomInvitationLinkService.createLink({
			...props,
			creatorUserId: userId,
			creatorSchoolId: user.school.id,
		});

		return roomInvitationLink;
	}

	public async updateLink(props: RoomInvitationLinkUpdateProps): Promise<RoomInvitationLink> {
		this.checkFeatureEnabled();

		// TODO: check permissions
		const roomInvitationLink = await this.roomInvitationLinkService.updateLink(props);

		return roomInvitationLink;
	}

	public async useLink(userId: EntityId, linkId: string): Promise<UseLinkResponse> {
		// TODO: is it sure at this point that the user is logged in?
		this.checkFeatureEnabled();

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const isTeacher = user.getRoles().some((role) => role.name === RoleName.TEACHER);
		const roomInvitationLink = await this.roomInvitationLinkService.findById(linkId);

		const validationResult = await this.checkValidity(roomInvitationLink, isTeacher, user);
		if (validationResult !== RoomInvitationLinkValidationResult.VALID) {
			return { validationResult };
		}
		// TODO: is any additional permission check required?

		await this.roomMembershipService.addMembersToRoom(roomInvitationLink.roomId, [userId]);
		await this.roomMembershipService.changeRoleOfRoomMembers(
			roomInvitationLink.roomId,
			[userId],
			roomInvitationLink.startingRole
		);

		const redirectUrl = `rooms/${roomInvitationLink.roomId}`;

		return { validationResult, redirectUrl };
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_ROOM_INVITATION_LINKS_ENABLED', { infer: true })) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOM_INVITATION_LINKS_ENABLED');
		}
	}

	private async checkValidity(
		roomInvitationLink: RoomInvitationLink,
		isTeacher: boolean,
		user: User
	): Promise<RoomInvitationLinkValidationResult> {
		if (roomInvitationLink.activeUntil && roomInvitationLink.activeUntil < new Date()) {
			return RoomInvitationLinkValidationResult.EXPIRED;
		}
		if (roomInvitationLink.isOnlyForTeachers && isTeacher === false) {
			return RoomInvitationLinkValidationResult.ONLY_FOR_TEACHERS;
		}
		if (roomInvitationLink.restrictedToCreatorSchool && user.school.id !== roomInvitationLink.creatorSchoolId) {
			return RoomInvitationLinkValidationResult.RESTRICTED_TO_CREATOR_SCHOOL;
		}
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(
			roomInvitationLink.roomId
		);
		const isAlreadyMember = roomMembershipAuthorizable.members.some((member) => member.userId === user.id);
		if (isAlreadyMember) {
			return RoomInvitationLinkValidationResult.ALREADY_MEMBER;
		}
		return RoomInvitationLinkValidationResult.VALID;
	}
}
