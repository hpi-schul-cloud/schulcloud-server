import { Action, AuthorizationService } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { RoomMembershipAuthorizable, RoomMembershipService } from '@modules/room-membership';
import { User } from '@modules/user/repo';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoomInvitationLink, RoomInvitationLinkUpdateProps } from '../domain/do/room-invitation-link.do';
import { RoomInvitationLinkService } from '../domain/service/room-invitation-link.service';
import { RoomConfig } from '../room.config';
import { CreateRoomInvitationLinkBodyParams } from './dto/request/create-room-invitation-link.body.params';
import { RoomInvitationLinkValidationError } from './type/room-invitation-link-validation-error.enum';

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

		await this.checkRoomAuthorizationByIds(userId, [roomInvitationLink.roomId], Action.write, [
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

	public async deleteLinks(userId: EntityId, linkIds: EntityId[]): Promise<void> {
		this.checkFeatureEnabled();

		const roomInvitationLinks = await this.roomInvitationLinkService.findByIds(linkIds);
		if (roomInvitationLinks.length !== linkIds.length) {
			throw new NotFoundException();
		}

		const roomIds = roomInvitationLinks.map((link) => link.roomId);
		const uniqueRoomIds = [...new Set(roomIds)];
		await this.checkRoomAuthorizationByIds(userId, uniqueRoomIds, Action.write, [Permission.ROOM_MEMBERS_ADD]);
		await this.roomInvitationLinkService.deleteLinks(linkIds);
	}

	public async listLinksByRoomId(userId: EntityId, roomId: EntityId): Promise<RoomInvitationLink[]> {
		this.checkFeatureEnabled();

		await this.checkRoomAuthorizationByIds(userId, [roomId], Action.write, [Permission.ROOM_MEMBERS_ADD]);

		const links = await this.roomInvitationLinkService.findLinkByRoomId(roomId);

		return links;
	}

	public async useLink(userId: EntityId, linkId: string): Promise<EntityId> {
		this.checkFeatureEnabled();

		const user = await this.authorizationService.getUserWithPermissions(userId);

		const [roomInvitationLink] = await this.roomInvitationLinkService.findByIds([linkId]);

		this.checkValidity(roomInvitationLink, user);

		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(
			roomInvitationLink.roomId
		);
		const isAlreadyMember = roomMembershipAuthorizable.members.some((member) => member.userId === user.id);
		if (!isAlreadyMember) {
			await this.roomMembershipService.addMembersToRoom(roomInvitationLink.roomId, [userId]);
			await this.roomMembershipService.changeRoleOfRoomMembers(
				roomInvitationLink.roomId,
				[userId],
				roomInvitationLink.startingRole
			);
		}

		return roomInvitationLink.roomId;
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_ROOM_INVITATION_LINKS_ENABLED', { infer: true })) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOM_INVITATION_LINKS_ENABLED');
		}
	}

	private checkValidity(roomInvitationLink: RoomInvitationLink | undefined, user: User): void {
		if (!roomInvitationLink) {
			throw new NotFoundException(RoomInvitationLinkValidationError.INVALID_LINK);
		}

		const isTeacher = user.getRoles().some((role) => role.name === RoleName.TEACHER);
		const isStudent = user.getRoles().some((role) => role.name === RoleName.STUDENT);

		if (roomInvitationLink.activeUntil && roomInvitationLink.activeUntil < new Date()) {
			throw new BadRequestException(RoomInvitationLinkValidationError.EXPIRED);
		}
		if (roomInvitationLink.isOnlyForTeachers && isTeacher === false) {
			throw new ForbiddenException(RoomInvitationLinkValidationError.ONLY_FOR_TEACHERS);
		}
		if (roomInvitationLink.restrictedToCreatorSchool && user.school.id !== roomInvitationLink.creatorSchoolId) {
			throw new ForbiddenException(RoomInvitationLinkValidationError.RESTRICTED_TO_CREATOR_SCHOOL);
		}
		if (user.school.id !== roomInvitationLink.creatorSchoolId && isStudent) {
			throw new ForbiddenException(RoomInvitationLinkValidationError.CANT_INVITE_STUDENTS_FROM_OTHER_SCHOOL);
		}
	}

	private async checkRoomAuthorizationByIds(
		userId: EntityId,
		roomIds: EntityId[],
		action: Action,
		requiredPermissions: Permission[] = []
	): Promise<RoomMembershipAuthorizable[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const authorizablePromises = roomIds.map((roomId) =>
			this.roomMembershipService.getRoomMembershipAuthorizable(roomId)
		);
		const roomMembershipAuthorizables = await Promise.all(authorizablePromises);

		for (const roomMembershipAuthorizable of roomMembershipAuthorizables) {
			this.authorizationService.checkPermission(user, roomMembershipAuthorizable, { action, requiredPermissions });
		}

		return roomMembershipAuthorizables;
	}
}
