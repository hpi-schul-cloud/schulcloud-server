import { Action, AuthorizationContext, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { RoomAuthorizable } from '../do/room-authorizable.do';

export const RoomOperationValues = [
	'accessRoom',
	'addAllStudents',
	'addExternalPersonByEmail',
	'addMembers',
	'addAllStudents',
	'arrangeRooms',
	'changeRolesOfMembers',
	'copyRoom',
	'createRoom',
	'deleteRoom',
	'editContent',
	'editRoomContent',
	'getRoomMembers',
	'getRoomMembersRedacted',
	'leaveRoom',
	'shareRoom',
	'updateRoom',
	'updateRoomInvitationLinks',
	'viewContent',
	'viewDraftContent',
	'viewMemberlist',
] as const;

export type RoomOperation = (typeof RoomOperationValues)[number]; // turn string list to type union of strings

type OperationFn = (user: User, authorizable: RoomAuthorizable) => boolean;

@Injectable()
export class RoomRule implements Rule<RoomAuthorizable> {
	constructor(private readonly authorisationInjectionService: AuthorizationInjectionService) {
		this.authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(_: User, object: unknown): boolean {
		const isMatched = object instanceof RoomAuthorizable;

		return isMatched;
	}

	public hasPermission(user: User, object: RoomAuthorizable, context: AuthorizationContext): boolean {
		const { action, requiredPermissions } = context;
		const roomPermissions = resolveRoomPermissions(user, object);

		if (!this.hasAccessToSchool(user, object.schoolId)) {
			return false;
		}

		if (!this.hasRequiredRoomPermissions(roomPermissions, requiredPermissions)) {
			return false;
		}

		if (action === Action.read) {
			return roomPermissions.includes(Permission.ROOM_LIST_CONTENT);
		}
		return roomPermissions.includes(Permission.ROOM_EDIT_CONTENT);
	}

	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	public getOperationMap() {
		const map = {
			accessRoom: canAccessRoom,
			addAllStudents: canAddAllStudents,
			addExternalPersonByEmail: canAddExternalPersonByEmail,
			addMembers: canAddMembers,
			arrangeRooms: canEditContent,
			changeRolesOfMembers: canChangeRolesOfMembers,
			copyRoom: canCopyRoom,
			createRoom: canCreateRoom,
			deleteRoom: canDeleteRoom,
			editContent: canEditContent,
			getRoomMembers: canGetRoomMembers,
			getRoomMembersRedacted: canGetRoomMembersRedacted,
			leaveRoom: canLeaveRoom,
			shareRoom: canShareRoom,
			updateRoom: canUpdateRoom,
			updateRoomInvitationLinks: canUpdateRoomInvitationLinks,
			viewContent: canViewContent,
			viewDraftContent: canViewDraftContent,
			viewMemberlist: canViewMemberlist,
		} satisfies Record<RoomOperation, OperationFn>;

		return map;
	}

	public listAllowedOperations(user: User, authorizable: RoomAuthorizable): Record<RoomOperation, boolean> {
		const list: Record<RoomOperation, boolean> = {} as Record<RoomOperation, boolean>;
		const map = this.getOperationMap();
		const operations = Object.keys(map) as RoomOperation[];

		for (const operation of operations) {
			const fn = map[operation];
			list[operation] = fn(user, authorizable);
		}

		return list;
	}

	public can(operation: RoomOperation, user: User, authorizable: RoomAuthorizable): boolean {
		const canFunction = this.getOperationMap()[operation];

		const can = canFunction(user, authorizable);

		return can;
	}

	private hasAccessToSchool(user: User, schoolId: string): boolean {
		const primarySchoolId = user.school.id;
		const secondarySchools = user.secondarySchools ?? [];
		const secondarySchoolIds = secondarySchools.map(({ school }) => school.id);

		const allSchools = [primarySchoolId, ...secondarySchoolIds];
		const includesSchool = allSchools.includes(schoolId);

		return includesSchool;
	}

	private hasRequiredRoomPermissions(roomPermissionsOfUser: Permission[], requiredPermissions: Permission[]): boolean {
		const missingPermissions = requiredPermissions.filter((permission) => !roomPermissionsOfUser.includes(permission));
		return missingPermissions.length === 0;
	}
}

const resolveUserPermissions = (
	user: User,
	object: RoomAuthorizable
): { schoolPermissions: Permission[]; roomPermissions: Permission[]; allPermissions: Permission[] } => {
	const schoolPermissions = resolveSchoolPermissions(user);
	const roomPermissions = resolveRoomPermissions(user, object);
	const allPermissions = [...schoolPermissions, ...roomPermissions];
	return {
		schoolPermissions,
		roomPermissions,
		allPermissions,
	};
};

const resolveSchoolPermissions = (user: User): Permission[] =>
	[...user.roles].flatMap((role) => role.permissions ?? []);

const resolveRoomPermissions = (user: User, object: RoomAuthorizable): Permission[] =>
	object.members
		.filter((member) => member.userId === user.id)
		.flatMap((member) => member.roles)
		.flatMap((role) => role.permissions ?? []);

const canCreateRoom = (user: User): boolean => {
	const schoolPermissions = resolveSchoolPermissions(user);

	const result = schoolPermissions.includes(Permission.SCHOOL_CREATE_ROOM);

	return result;
};

const canCopyRoom = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { roomPermissions } = resolveUserPermissions(user, roomAuthorizable);

	const hasRoomPermission = roomPermissions.includes(Permission.ROOM_COPY_ROOM);
	const canCopyRoom = canCreateRoom(user) && hasRoomPermission;

	return canCopyRoom;
};

const canAccessRoom = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { schoolPermissions, roomPermissions } = resolveUserPermissions(user, roomAuthorizable);
	const hasAdminPermission = schoolPermissions.includes(Permission.SCHOOL_ADMINISTRATE_ROOMS);

	if (!hasAdminPermission) {
		const hasRoomOwner = roomAuthorizable.members.some((member) =>
			member.roles.some((role) => role.name === RoleName.ROOMOWNER)
		);
		if (!hasRoomOwner) {
			return false;
		}
	}

	const hasRoomPermission = roomPermissions.includes(Permission.ROOM_LIST_CONTENT);
	if (hasRoomPermission) {
		return true;
	}

	const hasUsersFromAdminSchool =
		hasAdminPermission && roomAuthorizable.members.some((member) => member.userSchoolId === user.school.id);
	if (hasUsersFromAdminSchool) {
		return true;
	}

	const isRoomFromAdminSchool = hasAdminPermission && roomAuthorizable.schoolId === user.school.id;
	if (isRoomFromAdminSchool) {
		return true;
	}

	return false;
};

const canAddAllStudents = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { schoolPermissions } = resolveUserPermissions(user, roomAuthorizable);

	const canSeeAllStudents = schoolPermissions.includes(Permission.STUDENT_LIST);
	const canAddAllStudents = canAddMembers(user, roomAuthorizable) && canSeeAllStudents;

	return canAddAllStudents;
};

const canAddMembers = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { schoolPermissions, roomPermissions } = resolveUserPermissions(user, roomAuthorizable);
	const hasSchoolPermission = schoolPermissions.includes(Permission.SCHOOL_ADMINISTRATE_ROOMS);
	const hasRoomPermission = roomPermissions.includes(Permission.ROOM_ADD_MEMBERS);

	const isRoomOfAdminSchool = roomAuthorizable.schoolId === user.school.id;

	const result = hasRoomPermission || (hasSchoolPermission && isRoomOfAdminSchool);

	return result;
};

const canEditContent = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { roomPermissions } = resolveUserPermissions(user, roomAuthorizable);
	const hasRoomPermission = roomPermissions.includes(Permission.ROOM_EDIT_CONTENT);

	return hasRoomPermission;
};

const canAddExternalPersonByEmail = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { roomPermissions } = resolveUserPermissions(user, roomAuthorizable);
	const hasRoomPermission = roomPermissions.includes(Permission.ROOM_ADD_MEMBERS);

	return hasRoomPermission;
};

const canChangeRolesOfMembers = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { roomPermissions } = resolveUserPermissions(user, roomAuthorizable);

	const hasRoomPermission = roomPermissions.includes(Permission.ROOM_CHANGE_ROLES);

	return hasRoomPermission;
};

const canEditRoomContent = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { roomPermissions } = resolveUserPermissions(user, roomAuthorizable);

	const result = roomPermissions.includes(Permission.ROOM_EDIT_CONTENT);

	return result;
};

const canLeaveRoom = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { roomPermissions } = resolveUserPermissions(user, roomAuthorizable);

	const hasRoomPermission = roomPermissions.includes(Permission.ROOM_LEAVE_ROOM);

	return hasRoomPermission;
};

const canUpdateRoom = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { roomPermissions } = resolveUserPermissions(user, roomAuthorizable);

	const result = roomPermissions.includes(Permission.ROOM_EDIT_ROOM);

	return result;
};

const canDeleteRoom = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { schoolPermissions, roomPermissions } = resolveUserPermissions(user, roomAuthorizable);
	const hasRoomPermission = roomPermissions.includes(Permission.ROOM_DELETE_ROOM);
	const isOwnSchool = roomAuthorizable.schoolId === user.school.id;
	const canAdministrateSchoolRooms = schoolPermissions.includes(Permission.SCHOOL_ADMINISTRATE_ROOMS);

	const result = hasRoomPermission || (isOwnSchool && canAdministrateSchoolRooms);

	return result;
};

const canGetRoomMembers = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { schoolPermissions, roomPermissions } = resolveUserPermissions(user, roomAuthorizable);
	const hasSchoolPermission = schoolPermissions.includes(Permission.SCHOOL_LIST_ROOM_MEMBERS);
	const hasRoomPermission = roomPermissions.includes(Permission.ROOM_LIST_CONTENT);

	const result = hasSchoolPermission && hasRoomPermission;

	return result;
};

const canGetRoomMembersRedacted = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { schoolPermissions } = resolveUserPermissions(user, roomAuthorizable);
	const hasSchoolPermission = schoolPermissions.includes(Permission.SCHOOL_ADMINISTRATE_ROOMS);

	return hasSchoolPermission;
};

const canShareRoom = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { roomPermissions } = resolveUserPermissions(user, roomAuthorizable);
	const hasRoomPermission = roomPermissions.includes(Permission.ROOM_SHARE_ROOM);
	const canShareRoom = canCreateRoom(user) && hasRoomPermission;

	return canShareRoom;
};

const canUpdateRoomInvitationLinks = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { schoolPermissions, roomPermissions } = resolveUserPermissions(user, roomAuthorizable);
	const hasSchooolPermission = schoolPermissions.includes(Permission.SCHOOL_MANAGE_ROOM_INVITATIONLINKS);
	const hasRoomPermission = roomPermissions.includes(Permission.ROOM_MANAGE_INVITATIONLINKS);

	const canUpdateRoomInvitationLinks = hasSchooolPermission && hasRoomPermission;

	return canUpdateRoomInvitationLinks;
};

const canViewContent = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { roomPermissions } = resolveUserPermissions(user, roomAuthorizable);

	const hasRoomPermission = roomPermissions.includes(Permission.ROOM_LIST_CONTENT);

	return hasRoomPermission;
};

const canViewDraftContent = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { roomPermissions } = resolveUserPermissions(user, roomAuthorizable);

	const hasRoomPermission = roomPermissions.includes(Permission.ROOM_LIST_DRAFTS);

	return hasRoomPermission;
};

const canViewMemberlist = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
	const { schoolPermissions } = resolveUserPermissions(user, roomAuthorizable);
	const hasSchoolPermission = schoolPermissions.includes(Permission.SCHOOL_LIST_ROOM_MEMBERS);

	return hasSchoolPermission;
};
