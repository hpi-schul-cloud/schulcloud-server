import { AccountService } from '@modules/account';
import { Action, AuthorizationService } from '@modules/authorization';
import { RoleName, RoomRole } from '@modules/role';
import { RoomAuthorizable, RoomMembershipService } from '@modules/room-membership';
import { RoomMemberRule } from '@modules/room-membership/authorization/room-member.rule';
import { RoomOperation, RoomRule } from '@modules/room-membership/authorization/room.rule';
import { RoomMemberAuthorizable } from '@modules/room-membership/do/room-member-authorizable.do';
import { RoomMembershipStats } from '@modules/room-membership/type/room-membership-stats.type';
import { School, SchoolService } from '@modules/school';
import { UserDo, UserService } from '@modules/user';
import { User } from '@modules/user/repo'; // TODO: Auth service should use a different type
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common';
import { throwForbiddenIfFalse, throwUnauthorizedIfFalse } from '@shared/common/utils';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Room, RoomService } from '../domain';
import { CreateRoomBodyParams } from './dto/request/create-room.body.params';
import { UpdateRoomBodyParams } from './dto/request/update-room.body.params';
import { RoomMemberResponse } from './dto/response/room-member.response';
import { CantAssignRoomRoleToExternalPersonLoggableException } from './loggables/cant-assign-roomrole-to-external-person.error.loggable';
import { CantChangeOwnersRoleLoggableException } from './loggables/cant-change-roomowners-role.error.loggable';
import { RoomBoardService, RoomPermissionService } from './service';
import { RoomStats } from './type/room-stats.type';

@Injectable()
export class RoomUc {
	constructor(
		private readonly roomService: RoomService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly userService: UserService,
		private readonly authorizationService: AuthorizationService,
		private readonly roomPermissionService: RoomPermissionService,
		private readonly schoolService: SchoolService,
		private readonly roomBoardService: RoomBoardService,
		private readonly accountService: AccountService,
		private readonly roomRule: RoomRule,
		private readonly roomMemberRule: RoomMemberRule
	) {}

	public async getRoomStats(userId: EntityId, findOptions: IFindOptions<Room>): Promise<Page<RoomStats>> {
		this.roomPermissionService.checkFeatureAdministrateRoomsEnabled();
		const user = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkOneOfPermissions(user, [Permission.SCHOOL_ADMINISTRATE_ROOMS]);

		const roomMembershipStats = await this.roomMembershipService.getRoomMembershipStatsByUsersAndRoomsSchoolId(
			user.school.id,
			findOptions.pagination
		);
		const roomIds: EntityId[] = roomMembershipStats.data
			.flatMap((membership) => membership.roomId)
			.filter((id): id is EntityId => !!id);
		const rooms: Room[] = await this.roomService.getRoomsByIds(roomIds);

		const schoolIds: EntityId[] = rooms.map((room) => room.schoolId);
		const schools = await this.schoolService.getSchoolsByIds(schoolIds);

		const roomStats = this.mapRoomStats(roomMembershipStats, rooms, schools);

		return { data: roomStats, total: roomMembershipStats.total };
	}

	private mapRoomStats(membershipStats: Page<RoomMembershipStats>, rooms: Room[], schools: School[]): RoomStats[] {
		return membershipStats.data.map((membership) => {
			const room = rooms.find((r) => r.id === membership.roomId);
			const school = schools.find((s) => s.id === room?.schoolId);
			return {
				...membership,
				name: room?.name ?? '',
				schoolId: room?.schoolId ?? '',
				schoolName: school?.getProps().name ?? '',
				createdAt: room?.createdAt ?? new Date(),
				updatedAt: room?.updatedAt ?? new Date(),
			};
		});
	}

	public async createRoom(userId: EntityId, props: CreateRoomBodyParams): Promise<Room> {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		throwUnauthorizedIfFalse(this.roomRule.can('createRoom', user, null as unknown as RoomAuthorizable));

		const room = await this.roomService.createRoom({ ...props, schoolId: user.school.id });

		try {
			await this.roomMembershipService.createNewRoomMembership(room.id, userId);
			return room;
		} catch (err) {
			await this.roomService.deleteRoom(room);
			throw err;
		}
	}

	public async getSingleRoom(
		userId: EntityId,
		roomId: EntityId
	): Promise<{ room: Room; allowedOperations: Record<RoomOperation, boolean> }> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);

		throwForbiddenIfFalse(this.roomRule.can('accessRoom', user, roomAuthorizable));

		const room = await this.roomService.getSingleRoom(roomId);
		const allowedOperations = this.roomRule.listAllowedOperations(user, roomAuthorizable);

		return { room, allowedOperations };
	}

	public async updateRoom(
		userId: EntityId,
		roomId: EntityId,
		props: UpdateRoomBodyParams
	): Promise<{ room: Room; allowedOperations: Record<RoomOperation, boolean> }> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);

		throwForbiddenIfFalse(this.roomRule.can('updateRoom', user, roomAuthorizable));

		const room = await this.roomService.getSingleRoom(roomId);
		await this.roomService.updateRoom(room, props);
		const allowedOperations = this.roomRule.listAllowedOperations(user, roomAuthorizable);

		return { room, allowedOperations };
	}

	public async deleteRoom(userId: EntityId, roomId: EntityId): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);

		throwForbiddenIfFalse(this.roomRule.can('deleteRoom', user, roomAuthorizable));

		const room = await this.roomService.getSingleRoom(roomId);
		await this.roomService.deleteRoom(room);
		await this.roomMembershipService.deleteRoomMembership(roomId);
		await this.roomBoardService.deleteRoomContent(roomId);
	}

	public async getRoomMembers(userId: EntityId, roomId: EntityId): Promise<RoomMemberResponse[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);

		throwForbiddenIfFalse(this.roomRule.can('getRoomMembers', user, roomAuthorizable));

		const membersResponse = await this.getRoomMembersResponse(user, roomAuthorizable);
		return membersResponse;
	}

	public async getRoomMembersRedacted(userId: EntityId, roomId: EntityId): Promise<RoomMemberResponse[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);

		throwForbiddenIfFalse(this.roomRule.can('getRoomMembersRedacted', user, roomAuthorizable));

		const membersResponse = await this.getRoomMembersResponse(user, roomAuthorizable);
		const redactedMembersResponse = this.handleAnonymization(membersResponse, user.school.id);
		return redactedMembersResponse;
	}

	public async addMembersToRoom(userId: EntityId, roomId: EntityId, newUserIds: Array<EntityId>): Promise<RoomRole> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);

		throwForbiddenIfFalse(this.roomRule.can('addMembers', user, roomAuthorizable));

		await this.checkAreAllUsersAccessible(user, newUserIds);

		const roleName = await this.roomMembershipService.addMembersToRoom(roomId, newUserIds);
		return roleName;
	}

	public async addExternalPersonByEmailToRoom(userId: EntityId, roomId: EntityId, email: string): Promise<RoomRole> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);

		throwForbiddenIfFalse(this.roomRule.can('addExternalPersonByEmail', user, roomAuthorizable));

		const existingUser = await this.getUserByEmail(email);
		this.checkUserIsExternalPerson(existingUser);
		this.checkUserNotAlreadyMemberOfRoom(existingUser.id, roomAuthorizable);
		const roleName = await this.roomMembershipService.addMembersToRoom(roomId, [existingUser.id]);
		await this.roomService.sendRoomWelcomeMail(email, roomId);
		return roleName;
	}

	public async changeRolesOfMembers(
		currentUserId: EntityId,
		roomId: EntityId,
		userIds: Array<EntityId>,
		roleName: RoomRole
	): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(currentUserId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);

		throwForbiddenIfFalse(this.roomRule.can('changeRolesOfMembers', user, roomAuthorizable));

		await this.checkRoomRolesForExternalPersons(userIds, roleName);
		this.preventChangingOwnersRole(roomAuthorizable, userIds, currentUserId);

		await this.roomMembershipService.changeRoleOfRoomMembers(roomId, userIds, roleName);
	}

	public async passOwnership(currentUserId: EntityId, roomId: EntityId, targetUserId: EntityId): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(currentUserId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);
		const roomMemberAuthorizable = await this.getRoomMemberAuthorizable(roomAuthorizable, targetUserId);

		throwForbiddenIfFalse(this.roomMemberRule.can('passOwnershipTo', user, roomMemberAuthorizable));

		const currenRoomOwner = roomAuthorizable.members.find((member) =>
			member.roles.some((role) => role.name === RoleName.ROOMOWNER)
		);
		if (currenRoomOwner) {
			await this.roomMembershipService.changeRoleOfRoomMembers(roomId, [currenRoomOwner.userId], RoleName.ROOMADMIN);
		}
		await this.roomMembershipService.changeRoleOfRoomMembers(roomId, [targetUserId], RoleName.ROOMOWNER);
	}

	public async leaveRoom(currentUserId: EntityId, roomId: EntityId): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(currentUserId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);

		throwForbiddenIfFalse(this.roomRule.can('leaveRoom', user, roomAuthorizable));

		await this.roomMembershipService.removeMembersFromRoom(roomId, [currentUserId]);
	}

	public async removeMembersFromRoom(currentUserId: EntityId, roomId: EntityId, userIds: EntityId[]): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(currentUserId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);
		const roomMembers = await this.roomMembershipService.getRoomMembers(roomId);
		const roomMembersToBeDeleted = roomMembers.filter((member) => userIds.includes(member.userId));

		const roomMemberAuthorizables = await this.getRoomMemberAuthorizables(roomAuthorizable);
		for (const member of roomMembersToBeDeleted) {
			const roomMemberAuthorizable = roomMemberAuthorizables.find(
				(authorizable) => authorizable.member.userId === member.userId
			);
			if (roomMemberAuthorizable) {
				throwForbiddenIfFalse(this.roomMemberRule.can('removeMember', user, roomMemberAuthorizable));
			}
		}
		await this.roomMembershipService.removeMembersFromRoom(roomId, userIds);
	}

	private async getRoomMembersResponse(
		currentUser: User,
		roomAuthorizable: RoomAuthorizable
	): Promise<RoomMemberResponse[]> {
		const userIds = roomAuthorizable.members.map((member) => member.userId);
		const users = (await this.userService.getUserEntitiesWithRoles(userIds)).filter((user) => !user.deletedAt);
		const membersResponse = await this.buildRoomMembersResponse(currentUser, users, roomAuthorizable);

		return membersResponse;
	}

	private checkUserIsExternalPerson(user: UserDo): void {
		if (!user.roles.find((role) => role.name === RoleName.EXTERNALPERSON)) {
			throw new BadRequestException('User is not an external person');
		}
	}

	private checkUserNotAlreadyMemberOfRoom(userId: EntityId, roomAuthorizable: RoomAuthorizable): void {
		const isAlreadyMember = roomAuthorizable.members.some((member) => member.userId === userId);
		if (isAlreadyMember) {
			throw new BadRequestException('User is already a member of the room');
		}
	}

	private async buildRoomMembersResponse(
		currentUser: User,
		users: User[],
		roomAuthorizable: RoomAuthorizable
	): Promise<RoomMemberResponse[]> {
		const roomMemberAuthorizables = await this.getRoomMemberAuthorizables(roomAuthorizable);
		const membersResponse = users.map((user) => {
			const member = roomAuthorizable.members.find((item) => item.userId === user.id);
			if (!member) {
				/* istanbul ignore next */
				throw new Error('User not found in room members');
			}

			const roomMemberAuthorizable = roomMemberAuthorizables.find(
				(authorizable) => authorizable.member.userId === user.id
			);
			if (!roomMemberAuthorizable) {
				/* istanbul ignore next */
				throw new Error('User not found in room member authorizables');
			}
			const allowedOperations = this.roomMemberRule.listAllowedOperations(currentUser, roomMemberAuthorizable);
			const schoolRoleNames = user.roles.map((role) => role.name);
			return new RoomMemberResponse({
				userId: member.userId,
				firstName: user.firstName,
				lastName: user.lastName,
				roomRoleName: member.roles[0].name ?? '',
				schoolRoleNames,
				schoolName: user.school.name ?? '',
				schoolId: user.school.id,
				allowedOperations,
			});
		});
		console.log('membersResponse', membersResponse);
		return membersResponse;
	}

	private handleAnonymization(
		membersResponse: RoomMemberResponse[],
		currentUserSchoolId: EntityId
	): RoomMemberResponse[] {
		const redactedMembersResponse = membersResponse.map((member) => {
			const isRoomOwner = member.roomRoleName === RoleName.ROOMOWNER;
			const isFromSameSchool = member.schoolId === currentUserSchoolId;
			const shouldBeAnonymized = !isRoomOwner && !isFromSameSchool;
			return {
				...member,
				firstName: shouldBeAnonymized ? '---' : member.firstName,
				lastName: shouldBeAnonymized ? '---' : member.lastName,
			};
		});
		return redactedMembersResponse;
	}

	private preventChangingOwnersRole(
		roomAuthorizable: RoomAuthorizable,
		userIdsToChange: EntityId[],
		currentUserId: EntityId
	): void {
		const owner = roomAuthorizable.members.find((member) =>
			member.roles.some((role) => role.name === RoleName.ROOMOWNER)
		);
		if (owner && userIdsToChange.includes(owner.userId)) {
			throw new CantChangeOwnersRoleLoggableException({ roomId: roomAuthorizable.roomId, currentUserId });
		}
	}

	private async checkRoomRolesForExternalPersons(userIdsToChange: EntityId[], roleName: RoomRole): Promise<void> {
		const userPromises = userIdsToChange.map((userId) => this.authorizationService.getUserWithPermissions(userId));
		let users: User[] = [];
		users = await Promise.all(userPromises);

		for (const user of users) {
			const isExternalPerson = user.roles.getItems().some((role) => role.name === RoleName.EXTERNALPERSON);
			const isValidRoleForExternalPerson = [RoleName.ROOMVIEWER, RoleName.ROOMEDITOR].includes(roleName);
			if (isExternalPerson && !isValidRoleForExternalPerson) {
				throw new CantAssignRoomRoleToExternalPersonLoggableException({
					memberUserId: user.id || 'unknown',
					roomRole: roleName,
				});
			}
		}
	}

	private getPermissions(userId: EntityId, roomAuthorizable: RoomAuthorizable): Permission[] {
		const permissions = roomAuthorizable.members
			.filter((member) => member.userId === userId)
			.flatMap((member) => member.roles)
			.flatMap((role) => role.permissions ?? []);

		return permissions;
	}

	private async checkAreAllUsersAccessible(currentUser: User, newUserIds: EntityId[]): Promise<void> {
		const newUsers = await this.userService.findByIds(newUserIds);
		if (newUsers.length !== newUserIds.length) {
			throw new NotFoundException('One or more user IDs are invalid');
		}

		const areAllAccessible = newUsers.every((user) =>
			this.authorizationService.hasPermission(currentUser, user, {
				action: Action.read,
				requiredPermissions: [],
			})
		);
		if (areAllAccessible === false) {
			throw new ForbiddenException();
		}
	}

	private async getUserByEmail(email: string): Promise<UserDo & { id: EntityId }> {
		const [existingAccounts, totalNumberOfFoundAccounts] = await this.accountService.searchByUsernameExactMatch(email);
		if (existingAccounts.length === 0 || existingAccounts[0].userId === undefined) {
			throw new NotFoundException('No user found with the provided email');
		}
		if (totalNumberOfFoundAccounts > 1) {
			throw new InternalServerErrorException('Invalid data found');
		}
		const { userId } = existingAccounts[0];
		const existingUser = await this.userService.findById(userId);
		return { ...existingUser, id: userId };
	}

	private async getRoomMemberAuthorizable(
		roomAuthorizable: RoomAuthorizable,
		targetUserId: EntityId
	): Promise<RoomMemberAuthorizable> {
		const roomMemberAuthorizables = await this.getRoomMemberAuthorizables(roomAuthorizable);
		const roomMemberAuthorizable = roomMemberAuthorizables.find(
			(authorizable) => authorizable.member.userId === targetUserId
		);

		if (!roomMemberAuthorizable) {
			throw new ForbiddenException();
		}
		return roomMemberAuthorizable;
	}

	private async getRoomMemberAuthorizables(roomAuthorizable: RoomAuthorizable): Promise<RoomMemberAuthorizable[]> {
		const roomMembers = await this.roomMembershipService.getRoomMembers(roomAuthorizable.roomId);
		const roomMemberAuthorizables = roomMembers.map(
			(roomMember) => new RoomMemberAuthorizable(roomAuthorizable, roomMember)
		);
		return roomMemberAuthorizables;
	}
}
