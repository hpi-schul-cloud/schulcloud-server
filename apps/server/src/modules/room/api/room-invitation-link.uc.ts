import { Action, AuthorizationService } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { RoomMembershipAuthorizable, RoomMembershipService } from '@modules/room-membership';
import { User } from '@modules/user/repo';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoomInvitationLink, RoomInvitationLinkUpdateProps } from '../domain/do/room-invitation-link.do';
import { RoomInvitationLinkService } from '../domain/service/room-invitation-link.service';
import { RoomConfig } from '../room.config';
import { CreateRoomInvitationLinkBodyParams } from './dto/request/create-room-invitation-link.body.params';
import { RoomInvitationLinkValidationResult } from './type/room-invitation-link-validation-result.enum';

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
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(props.roomId);
		this.authorizationService.checkPermission(user, roomMembershipAuthorizable, {
			action: Action.write,
			requiredPermissions: [Permission.ROOM_MEMBERS_ADD],
		});

		const roomInvitationLink = await this.roomInvitationLinkService.createLink({
			...props,
			creatorUserId: userId,
			creatorSchoolId: user.school.id,
		});

		return roomInvitationLink;
	}

	public async updateLink(userId: EntityId, props: RoomInvitationLinkUpdateProps): Promise<RoomInvitationLink> {
		this.checkFeatureEnabled();

		const roomInvitationLink = await this.roomInvitationLinkService.findById(props.id);

		await this.checkRoomAuthorizationByIds(userId, roomInvitationLink.roomId, Action.write, [
			Permission.ROOM_MEMBERS_ADD,
		]);

		roomInvitationLink.title = props.title ?? roomInvitationLink.title;
		roomInvitationLink.isOnlyForTeachers = props.isOnlyForTeachers ?? roomInvitationLink.isOnlyForTeachers;
		roomInvitationLink.activeUntil = props.activeUntil ?? roomInvitationLink.activeUntil;
		roomInvitationLink.requiresConfirmation = props.requiresConfirmation ?? roomInvitationLink.requiresConfirmation;
		roomInvitationLink.restrictedToCreatorSchool =
			props.restrictedToCreatorSchool ?? roomInvitationLink.restrictedToCreatorSchool;

		await this.roomInvitationLinkService.saveLink(roomInvitationLink);

		return roomInvitationLink;
	}

	public async deleteLink(userId: EntityId, linkId: EntityId): Promise<void> {
		this.checkFeatureEnabled();

		const roomInvitationLink = await this.roomInvitationLinkService.findById(linkId);

		await this.checkRoomAuthorizationByIds(userId, roomInvitationLink.roomId, Action.write, [
			Permission.ROOM_MEMBERS_ADD,
		]);

		await this.roomInvitationLinkService.deleteLink(roomInvitationLink.id);
	}

	public async listLinksByRoomId(userId: EntityId, roomId: EntityId): Promise<RoomInvitationLink[]> {
		this.checkFeatureEnabled();

		await this.checkRoomAuthorizationByIds(userId, roomId, Action.write, [Permission.ROOM_MEMBERS_ADD]);

		const links = await this.roomInvitationLinkService.findLinkByRoomId(roomId);

		return links;
	}

	public async useLink(userId: EntityId, linkId: string): Promise<UseLinkResponse> {
		this.checkFeatureEnabled();

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomInvitationLink = await this.roomInvitationLinkService.findById(linkId);

		const validationResult = await this.checkValidity(roomInvitationLink, user);

		await this.roomMembershipService.addMembersToRoom(roomInvitationLink.roomId, [userId]);
		await this.roomMembershipService.changeRoleOfRoomMembers(
			roomInvitationLink.roomId,
			[userId],
			roomInvitationLink.startingRole
		);

		return { validationResult };
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_ROOM_INVITATION_LINKS_ENABLED', { infer: true })) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOM_INVITATION_LINKS_ENABLED');
		}
	}

	private async checkValidity(
		roomInvitationLink: RoomInvitationLink,
		user: User
	): Promise<RoomInvitationLinkValidationResult> {
		const isTeacher = user.getRoles().some((role) => role.name === RoleName.TEACHER);
		const isStudent = user.getRoles().some((role) => role.name === RoleName.STUDENT);

		if (roomInvitationLink.activeUntil && roomInvitationLink.activeUntil < new Date()) {
			throw new BadRequestException(RoomInvitationLinkValidationResult.EXPIRED);
		}
		if (roomInvitationLink.isOnlyForTeachers && isTeacher === false) {
			throw new ForbiddenException(RoomInvitationLinkValidationResult.ONLY_FOR_TEACHERS);
		}
		if (roomInvitationLink.restrictedToCreatorSchool && user.school.id !== roomInvitationLink.creatorSchoolId) {
			throw new ForbiddenException(RoomInvitationLinkValidationResult.RESTRICTED_TO_CREATOR_SCHOOL);
		}
		if (user.school.id !== roomInvitationLink.creatorSchoolId && isStudent) {
			throw new ForbiddenException(RoomInvitationLinkValidationResult.CANT_INVITE_STUDENTS_FROM_OTHER_SCHOOL);
		}
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(
			roomInvitationLink.roomId
		);
		const isAlreadyMember = roomMembershipAuthorizable.members.some((member) => member.userId === user.id);
		if (isAlreadyMember) {
			throw new BadRequestException(RoomInvitationLinkValidationResult.ALREADY_MEMBER);
		}
		return RoomInvitationLinkValidationResult.VALID;
	}

	private async checkRoomAuthorizationByIds(
		userId: EntityId,
		roomId: EntityId,
		action: Action,
		requiredPermissions: Permission[] = []
	): Promise<RoomMembershipAuthorizable> {
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(roomId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, roomMembershipAuthorizable, { action, requiredPermissions });

		return roomMembershipAuthorizable;
	}
}
