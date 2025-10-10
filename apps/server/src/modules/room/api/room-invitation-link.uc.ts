import { Action, AuthorizationService } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { RoomMembershipAuthorizable, RoomMembershipService } from '@modules/room-membership';
import { SchoolService } from '@modules/school';
import { User } from '@modules/user/repo';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoomInvitationLink, RoomInvitationLinkUpdateProps } from '../domain/do/room-invitation-link.do';
import { RoomInvitationLinkService } from '../domain/service/room-invitation-link.service';
import { RoomConfig } from '../room.config';
import { CreateRoomInvitationLinkBodyParams } from './dto/request/create-room-invitation-link.body.params';
import { RoomInvitationLinkError } from './dto/response/room-invitation-link.error';
import { RoomInvitationLinkValidationError } from './type/room-invitation-link-validation-error.enum';

@Injectable()
export class RoomInvitationLinkUc {
	constructor(
		private readonly configService: ConfigService<RoomConfig, true>,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly roomInvitationLinkService: RoomInvitationLinkService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService
	) {}

	public async createLink(userId: EntityId, props: CreateRoomInvitationLinkBodyParams): Promise<RoomInvitationLink> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(props.roomId);
		this.authorizationService.checkPermission(user, roomMembershipAuthorizable, {
			action: Action.write,
			requiredPermissions: [Permission.ROOM_ADD_MEMBERS],
		});

		const roomInvitationLink = await this.roomInvitationLinkService.createLink({
			...props,
			creatorUserId: userId,
			creatorSchoolId: user.school.id,
		});

		return roomInvitationLink;
	}

	public async updateLink(userId: EntityId, props: RoomInvitationLinkUpdateProps): Promise<RoomInvitationLink> {
		const roomInvitationLink = await this.roomInvitationLinkService.findById(props.id);

		await this.checkRoomAuthorizationByIds(userId, [roomInvitationLink.roomId], Action.write, [
			Permission.ROOM_ADD_MEMBERS,
		]);

		roomInvitationLink.title = props.title ?? roomInvitationLink.title;
		roomInvitationLink.isUsableByExternalPersons =
			props.isUsableByExternalPersons ?? roomInvitationLink.isUsableByExternalPersons;
		roomInvitationLink.isUsableByStudents = props.isUsableByStudents ?? roomInvitationLink.isUsableByStudents;
		roomInvitationLink.activeUntil = props.activeUntil ?? roomInvitationLink.activeUntil;
		roomInvitationLink.requiresConfirmation = props.requiresConfirmation ?? roomInvitationLink.requiresConfirmation;
		roomInvitationLink.restrictedToCreatorSchool =
			props.restrictedToCreatorSchool ?? roomInvitationLink.restrictedToCreatorSchool;

		await this.roomInvitationLinkService.saveLink(roomInvitationLink);

		return roomInvitationLink;
	}

	public async deleteLinks(userId: EntityId, linkIds: EntityId[]): Promise<void> {
		const roomInvitationLinks = await this.roomInvitationLinkService.findByIds(linkIds);
		if (roomInvitationLinks.length !== linkIds.length) {
			throw new NotFoundException();
		}

		const roomIds = roomInvitationLinks.map((link) => link.roomId);
		const uniqueRoomIds = [...new Set(roomIds)];
		await this.checkRoomAuthorizationByIds(userId, uniqueRoomIds, Action.write, [Permission.ROOM_ADD_MEMBERS]);
		await this.roomInvitationLinkService.deleteLinks(linkIds);
	}

	public async listLinksByRoomId(userId: EntityId, roomId: EntityId): Promise<RoomInvitationLink[]> {
		await this.checkRoomAuthorizationByIds(userId, [roomId], Action.write, [Permission.ROOM_ADD_MEMBERS]);

		const links = await this.roomInvitationLinkService.findLinkByRoomId(roomId);

		return links;
	}

	public async useLink(userId: EntityId, linkId: string): Promise<EntityId> {
		const [user, roomInvitationLink] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.tryGetLink(linkId),
		]);

		await this.checkValidity(roomInvitationLink, user);
		const roleName = await this.ensureUserIsInRoom(roomInvitationLink, userId);

		if (roleName === RoleName.ROOMAPPLICANT) {
			throw new RoomInvitationLinkError(RoomInvitationLinkValidationError.ROOM_APPLICANT_WAITING, HttpStatus.FORBIDDEN);
		}
		return roomInvitationLink.roomId;
	}

	private async tryGetLink(linkId: string): Promise<RoomInvitationLink> {
		try {
			return await this.roomInvitationLinkService.findById(linkId);
		} catch {
			throw new RoomInvitationLinkError(RoomInvitationLinkValidationError.INVALID_LINK, HttpStatus.NOT_FOUND);
		}
	}

	private async ensureUserIsInRoom(roomInvitationLink: RoomInvitationLink, userId: EntityId): Promise<RoleName> {
		const currentRoleName = await this.getCurrentRole(roomInvitationLink.roomId, userId);

		if (!currentRoleName) {
			await this.roomMembershipService.addMembersToRoom(
				roomInvitationLink.roomId,
				[userId],
				roomInvitationLink.startingRole
			);
			return roomInvitationLink.startingRole;
		}
		if (currentRoleName === RoleName.ROOMAPPLICANT) {
			await this.changeRoleTo(roomInvitationLink.roomId, userId, roomInvitationLink.startingRole);
			return roomInvitationLink.startingRole;
		}
		return currentRoleName;
	}

	private async getCurrentRole(roomId: EntityId, userId: EntityId): Promise<RoleName | undefined> {
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(roomId);
		const member = roomMembershipAuthorizable.members.find((member) => member.userId === userId);

		const roleName = member?.roles[0].name;
		return roleName;
	}

	private async changeRoleTo(roomId: EntityId, userId: EntityId, roleName: RoleName): Promise<void> {
		await this.roomMembershipService.changeRoleOfRoomMembers(roomId, [userId], roleName);
	}

	private async checkValidity(roomInvitationLink: RoomInvitationLink | undefined, user: User): Promise<void> {
		if (!roomInvitationLink) {
			throw new RoomInvitationLinkError(RoomInvitationLinkValidationError.INVALID_LINK, HttpStatus.NOT_FOUND);
		}

		const isTeacher = user.getRoles().some((role) => role.name === RoleName.TEACHER);
		const isStudent = user.getRoles().some((role) => role.name === RoleName.STUDENT);
		const isExternalPerson = user.getRoles().some((role) => role.name === RoleName.EXPERT);

		if (roomInvitationLink.activeUntil && roomInvitationLink.activeUntil < new Date()) {
			throw new RoomInvitationLinkError(RoomInvitationLinkValidationError.EXPIRED, HttpStatus.BAD_REQUEST);
		}
		if (
			!roomInvitationLink.isUsableByStudents &&
			!roomInvitationLink.isUsableByExternalPersons &&
			isTeacher === false
		) {
			throw new RoomInvitationLinkError(RoomInvitationLinkValidationError.ONLY_FOR_TEACHERS, HttpStatus.FORBIDDEN);
		}
		if (isExternalPerson && !roomInvitationLink.isUsableByExternalPersons) {
			throw new RoomInvitationLinkError(
				RoomInvitationLinkValidationError.ONLY_FOR_INTERNAL_USERS,
				HttpStatus.FORBIDDEN
			);
		}
		if (isStudent && !roomInvitationLink.isUsableByStudents) {
			throw new RoomInvitationLinkError(RoomInvitationLinkValidationError.ONLY_FOR_TEACHERS, HttpStatus.FORBIDDEN);
		}
		const creatorSchool = await this.schoolService.getSchoolById(roomInvitationLink.creatorSchoolId);

		if (roomInvitationLink.restrictedToCreatorSchool && user.school.id !== roomInvitationLink.creatorSchoolId) {
			throw new RoomInvitationLinkError(
				RoomInvitationLinkValidationError.RESTRICTED_TO_CREATOR_SCHOOL,
				HttpStatus.FORBIDDEN,
				creatorSchool.getInfo().name
			);
		}
		if (user.school.id !== roomInvitationLink.creatorSchoolId && isStudent) {
			const creatorSchool = await this.schoolService.getSchoolById(roomInvitationLink.creatorSchoolId);
			throw new RoomInvitationLinkError(
				RoomInvitationLinkValidationError.CANT_INVITE_STUDENTS_FROM_OTHER_SCHOOL,
				HttpStatus.FORBIDDEN,
				creatorSchool.getInfo().name
			);
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
