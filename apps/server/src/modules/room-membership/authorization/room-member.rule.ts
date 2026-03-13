import { AuthorizationContext, AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { RoomAuthorizable } from '../do/room-authorizable.do';
import { RoomMemberAuthorizable } from '../do/room-member-authorizable.do';
import { RoomRule } from './room.rule';

export const RoomMemberOperationValues = ['changeRole', 'passOwnershipTo', 'removeMember'] as const;

export type RoomMemberOperation = (typeof RoomMemberOperationValues)[number]; // turn string list to type union of strings

type OperationFn = (user: User, authorizable: RoomMemberAuthorizable) => boolean;

@Injectable()
export class RoomMemberRule implements Rule<RoomMemberAuthorizable> {
	constructor(
		private readonly roomRule: RoomRule,
		private readonly authorizationHelper: AuthorizationHelper,
		private readonly authorisationInjectionService: AuthorizationInjectionService
	) {
		this.authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(_: User, object: unknown): boolean {
		const isMatched = object instanceof RoomMemberAuthorizable;

		return isMatched;
	}

	public hasPermission(user: User, object: RoomMemberAuthorizable, context: AuthorizationContext): boolean {
		if (!this.hasAccessToSchool(user, object.schoolId)) {
			return false;
		}
		const hasAllPermissions = this.hasAllPermissions(user, object, context.requiredPermissions ?? []);

		return hasAllPermissions;
	}

	private hasAllPermissions(user: User, object: RoomMemberAuthorizable, requiredPermissions: Permission[]): boolean {
		const { allPermissions } = this.resolveUserPermissions(user, object.roomAuthorizable);
		const missingPermissions = requiredPermissions.filter((permission) => !allPermissions.includes(permission));
		return missingPermissions.length === 0;
	}

	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	public getOperationMap() {
		const map = {
			changeRole: this.canChangeRole.bind(this),
			passOwnershipTo: this.canPassOwnershipTo.bind(this),
			removeMember: this.canRemoveMember.bind(this),
		} satisfies Record<RoomMemberOperation, OperationFn>;

		return map;
	}

	public listAllowedOperations(user: User, authorizable: RoomMemberAuthorizable): Record<RoomMemberOperation, boolean> {
		const list: Record<RoomMemberOperation, boolean> = {} as Record<RoomMemberOperation, boolean>;
		const map = this.getOperationMap();
		const operations = Object.keys(map) as RoomMemberOperation[];

		for (const operation of operations) {
			const fn = map[operation];
			list[operation] = fn(user, authorizable);
		}

		return list;
	}

	public can(operation: RoomMemberOperation, user: User, authorizable: RoomMemberAuthorizable): boolean {
		const canFunction = this.getOperationMap()[operation];

		const can = canFunction(user, authorizable);

		return can;
	}

	private canChangeRole(user: User, object: RoomMemberAuthorizable): boolean {
		const { roomPermissions } = this.resolveUserPermissions(user, object.roomAuthorizable);

		const isChangeRoleOfRoomOwner = object.member.roomRoleName === RoleName.ROOMOWNER;
		if (isChangeRoleOfRoomOwner) {
			return false;
		}

		const hasRoomPermission = roomPermissions.includes(Permission.ROOM_CHANGE_ROLES);
		const isHimself = object.member.userId === user.id;
		if (hasRoomPermission && !isHimself) {
			return true;
		}

		const isAdminOfSchoolOfMember = this.isAdminOfSchoolOfMember(user, object);
		if (isAdminOfSchoolOfMember) {
			return true;
		}

		return false;
	}

	private canPassOwnershipTo(user: User, object: RoomMemberAuthorizable): boolean {
		const { roomPermissions } = this.resolveUserPermissions(user, object.roomAuthorizable);

		const isAlreadyRoomOwner = object.member.roomRoleName === RoleName.ROOMOWNER;
		const isStudent = object.member.schoolRoleNames.includes(RoleName.STUDENT);
		const isExternalPerson = object.member.schoolRoleNames.includes(RoleName.EXTERNALPERSON);
		if (isAlreadyRoomOwner || isStudent || isExternalPerson) {
			return false;
		}

		const isAdminOfSchoolOfMember = this.isAdminOfSchoolOfMember(user, object);
		if (isAdminOfSchoolOfMember) {
			return true;
		}

		const hasPermission = roomPermissions.includes(Permission.ROOM_CHANGE_OWNER);
		const isHimself = object.member.userId === user.id;

		return hasPermission && !isHimself;
	}

	private canRemoveMember(user: User, object: RoomMemberAuthorizable): boolean {
		const { roomPermissions } = this.resolveUserPermissions(user, object.roomAuthorizable);

		const isRemoveRoomOwner = object.member.roomRoleName === RoleName.ROOMOWNER;
		if (isRemoveRoomOwner) {
			return false;
		}

		const hasRoomPermission = roomPermissions.includes(Permission.ROOM_REMOVE_MEMBERS);
		const isHimself = object.member.userId === user.id;
		if (hasRoomPermission && !isHimself) {
			return true;
		}

		const isAdminOfSchoolOfMember = this.isAdminOfSchoolOfMember(user, object);
		if (isAdminOfSchoolOfMember) {
			return true;
		}

		return false;
	}

	private isAdminOfSchoolOfMember(user: User, object: RoomMemberAuthorizable): boolean {
		const canAdministrateSchoolRooms = this.authorizationHelper.hasOneOfPermissions(user, [
			Permission.SCHOOL_ADMINISTRATE_ROOMS,
		]);
		const isSameSchool = object.member.schoolId === user.school.id;

		return canAdministrateSchoolRooms && isSameSchool;
	}

	private hasAccessToSchool(user: User, schoolId: string): boolean {
		const primarySchoolId = user.school.id;
		const secondarySchools = user.secondarySchools ?? [];
		const secondarySchoolIds = secondarySchools.map(({ school }) => school.id);

		const allSchools = [primarySchoolId, ...secondarySchoolIds];
		const includesSchool = allSchools.includes(schoolId);

		return includesSchool;
	}

	private resolveUserPermissions(
		user: User,
		object: RoomAuthorizable
	): { schoolPermissions: Permission[]; roomPermissions: Permission[]; allPermissions: Permission[] } {
		const schoolPermissions = this.resolveSchoolPermissions(user);
		const roomPermissions = this.resolveRoomPermissions(user, object);
		const allPermissions = [...schoolPermissions, ...roomPermissions];
		return {
			schoolPermissions,
			roomPermissions,
			allPermissions,
		};
	}

	private resolveSchoolPermissions(user: User): Permission[] {
		return [...user.roles].flatMap((role) => role.permissions ?? []);
	}

	private resolveRoomPermissions(user: User, object: RoomAuthorizable): Permission[] {
		return object.members
			.filter((member) => member.userId === user.id)
			.flatMap((member) => member.roles)
			.flatMap((role) => role.permissions ?? []);
	}
}
