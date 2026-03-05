import { AuthorizationService } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { RoomMembershipService } from '@modules/room-membership';
import { BadRequestException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RoomInvitationLink, RoomInvitationLinkUpdateProps } from '../domain/do/room-invitation-link.do';
import { RoomInvitationLinkService } from '../domain/service/room-invitation-link.service';
import { ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig } from '../room.config';
import { CreateRoomInvitationLinkBodyParams } from './dto/request/create-room-invitation-link.body.params';
import { RoomInvitationLinkError } from './dto/response/room-invitation-link.error';
import { RoomInvitationLinkValidationError } from './type/room-invitation-link-validation-error.enum';
import { RoomRule } from '@modules/room-membership/authorization/room.rule';
import { throwForbiddenIfFalse } from '@shared/common/utils/wrap-with-exception';
import { RoomInvitationLinkRule } from '@modules/room-membership/authorization/room-invitation-link.rule';

@Injectable()
export class RoomInvitationLinkUc {
	constructor(
		@Inject(ROOM_PUBLIC_API_CONFIG_TOKEN) private readonly config: RoomPublicApiConfig,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly roomInvitationLinkService: RoomInvitationLinkService,
		private readonly authorizationService: AuthorizationService,
		private readonly roomRule: RoomRule,
		private readonly roomInvitationLinkRule: RoomInvitationLinkRule
	) {}

	public async createLink(userId: EntityId, props: CreateRoomInvitationLinkBodyParams): Promise<RoomInvitationLink> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(props.roomId);

		throwForbiddenIfFalse(this.roomRule.can('createRoomInvitationLinks', user, roomAuthorizable));

		const roomInvitationLink = await this.roomInvitationLinkService.createLink({
			...props,
			creatorUserId: userId,
			creatorSchoolId: user.school.id,
		});

		return roomInvitationLink;
	}

	public async updateLink(userId: EntityId, props: RoomInvitationLinkUpdateProps): Promise<RoomInvitationLink> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomInvitationLink = await this.roomInvitationLinkService.findById(props.id);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomInvitationLink.roomId);

		throwForbiddenIfFalse(this.roomRule.can('updateRoomInvitationLinks', user, roomAuthorizable));

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

		if (uniqueRoomIds.length > 1) {
			throw new BadRequestException('All links must belong to the same room');
		}

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(uniqueRoomIds[0]);

		throwForbiddenIfFalse(this.roomRule.can('deleteRoomInvitationLinks', user, roomAuthorizable));

		await this.roomInvitationLinkService.deleteLinks(linkIds);
	}

	public async listLinksByRoomId(userId: EntityId, roomId: EntityId): Promise<RoomInvitationLink[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);

		throwForbiddenIfFalse(this.roomRule.can('listRoomInvitationLinks', user, roomAuthorizable));

		const links = await this.roomInvitationLinkService.findLinkByRoomId(roomId);

		return links;
	}

	public async useLink(userId: EntityId, linkId: string): Promise<EntityId> {
		const [user, roomInvitationLink] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.tryGetLink(linkId),
		]);
		const authorizable = await this.roomMembershipService.getRoomInvitationLinkAuthorizable(roomInvitationLink);

		this.roomInvitationLinkRule.check('useRoomInvitationLinks', user, authorizable);

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
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomInvitationLink.roomId);
		const currentRoleName = roomAuthorizable.getRoleOfUser(userId)?.name;

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

	private async changeRoleTo(roomId: EntityId, userId: EntityId, roleName: RoleName): Promise<void> {
		await this.roomMembershipService.changeRoleOfRoomMembers(roomId, [userId], roleName);
	}
}
