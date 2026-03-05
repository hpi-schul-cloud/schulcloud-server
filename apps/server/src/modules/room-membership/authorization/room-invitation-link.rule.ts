import { Action, AuthorizationContext, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { User } from '@modules/user/repo';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { RoomInvitationLinkAuthorizable } from '../do/room-invitation-link-authorizable.do';
import { RoleName } from '@modules/role';
import { RoomInvitationLinkError } from '@modules/room/api/dto/response/room-invitation-link.error';
import { RoomInvitationLinkValidationError } from '@modules/room/api/type/room-invitation-link-validation-error.enum';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';

export const RoomInvitationLinkOperationValues = ['useRoomInvitationLinks'] as const;

export type RoomInvitationLinkOperation = (typeof RoomInvitationLinkOperationValues)[number]; // turn string list to type union of strings

type OperationFn = (user: User, authorizable: RoomInvitationLinkAuthorizable) => boolean | Promise<boolean>;

@Injectable()
export class RoomInvitationLinkRule implements Rule<RoomInvitationLinkAuthorizable> {
	constructor(private readonly authorisationInjectionService: AuthorizationInjectionService) {
		this.authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(_: User, object: unknown): boolean {
		const isMatched = object instanceof RoomInvitationLinkAuthorizable;

		return isMatched;
	}

	public hasPermission(user: User, object: RoomInvitationLinkAuthorizable, context: AuthorizationContext): boolean {
		const { action, requiredPermissions } = context;
		const roomPermissions = resolveRoomPermissions(user, object);

		if (!this.hasAccessToSchool(user, object.schoolId)) {
			return false;
		}

		if (!this.hasRequiredRoomPermissions(roomPermissions, requiredPermissions)) {
			return false;
		}

		if (action === Action.read) {
			return roomPermissions.includes(Permission.ROOM_MANAGE_INVITATIONLINKS);
		}
		return roomPermissions.includes(Permission.ROOM_MANAGE_INVITATIONLINKS);
	}

	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	public getOperationMap() {
		const map = {
			useRoomInvitationLinks: canUseRoomInvitationLinks,
		} satisfies Record<RoomInvitationLinkOperation, OperationFn>;

		return map;
	}

	public listAllowedOperations(
		user: User,
		authorizable: RoomInvitationLinkAuthorizable
	): Record<RoomInvitationLinkOperation, boolean> {
		const list: Record<RoomInvitationLinkOperation, boolean> = {} as Record<RoomInvitationLinkOperation, boolean>;
		const map = this.getOperationMap();
		const operations = Object.keys(map) as RoomInvitationLinkOperation[];

		for (const operation of operations) {
			list[operation] = this.can(operation, user, authorizable);
		}

		return list;
	}

	public check(operation: RoomInvitationLinkOperation, user: User, authorizable: RoomInvitationLinkAuthorizable): void {
		const canFunction = this.getOperationMap()[operation];

		canFunction(user, authorizable);
	}

	public can(
		operation: RoomInvitationLinkOperation,
		user: User,
		authorizable: RoomInvitationLinkAuthorizable
	): boolean {
		const canFunction = this.getOperationMap()[operation];

		try {
			canFunction(user, authorizable);
			return true;
		} catch {
			return false;
		}
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

const resolveRoomPermissions = (user: User, object: RoomInvitationLinkAuthorizable): Permission[] => {
	const { roomAuthorizable } = object;
	return roomAuthorizable.members
		.filter((member) => member.userId === user.id)
		.flatMap((member) => member.roles)
		.flatMap((role) => role.permissions ?? []);
};

const checkValidity = (user: User, authorizable: RoomInvitationLinkAuthorizable): void => {
	const { roomInvitationLink } = authorizable;

	checkRoleValidity(user, authorizable);
	if (roomInvitationLink.activeUntil && roomInvitationLink.activeUntil < new Date()) {
		throw new RoomInvitationLinkError(
			RoomInvitationLinkValidationError.EXPIRED,
			HttpStatus.BAD_REQUEST,
			authorizable.schoolName
		);
	}

	checkCreatorSchoolRestriction(user, authorizable);
	checkStudentFromOtherSchool(user, authorizable);
};

const checkRoleValidity = (user: User, authorizable: RoomInvitationLinkAuthorizable): void => {
	const { roomInvitationLink } = authorizable;
	const isTeacher = user.getRoles().some((role) => role.name === RoleName.TEACHER);
	const isStudent = user.getRoles().some((role) => role.name === RoleName.STUDENT);
	const isExternalPerson = user.getRoles().some((role) => role.name === RoleName.EXTERNALPERSON);

	if (isTeacher) {
		return;
	}
	if (isStudent && roomInvitationLink.isUsableByStudents) {
		return;
	}
	if (isExternalPerson && roomInvitationLink.isUsableByExternalPersons) {
		if (!authorizable.config.featureRoomLinkInvitationExternalPersonsEnabled) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOM_LINK_INVITATION_EXTERNAL_PERSONS_ENABLED');
		}
		return;
	}

	throw new RoomInvitationLinkError(
		RoomInvitationLinkValidationError.NOT_USABLE_FOR_CURRENT_ROLE,
		HttpStatus.FORBIDDEN
	);
};

const checkCreatorSchoolRestriction = (user: User, authorizable: RoomInvitationLinkAuthorizable): void => {
	const { roomInvitationLink } = authorizable;
	const isExternalPerson = user.getRoles().some((role) => role.name === RoleName.EXTERNALPERSON);
	const skipSchoolRestrictionCheck = isExternalPerson && roomInvitationLink.isUsableByExternalPersons;
	if (skipSchoolRestrictionCheck) return;

	const { schoolName } = authorizable;
	if (roomInvitationLink?.restrictedToCreatorSchool && user.school.id !== roomInvitationLink.creatorSchoolId) {
		throw new RoomInvitationLinkError(
			RoomInvitationLinkValidationError.RESTRICTED_TO_CREATOR_SCHOOL,
			HttpStatus.FORBIDDEN,
			schoolName
		);
	}
};

const checkStudentFromOtherSchool = (user: User, authorizable: RoomInvitationLinkAuthorizable): void => {
	const { roomInvitationLink } = authorizable;

	const isStudent = user.getRoles().some((role) => role.name === RoleName.STUDENT);
	if (user.school.id !== roomInvitationLink.creatorSchoolId && isStudent) {
		const { schoolName } = authorizable;
		throw new RoomInvitationLinkError(
			RoomInvitationLinkValidationError.CANT_INVITE_STUDENTS_FROM_OTHER_SCHOOL,
			HttpStatus.FORBIDDEN,
			schoolName
		);
	}
};

const canUseRoomInvitationLinks = (user: User, authorizable: RoomInvitationLinkAuthorizable): boolean => {
	checkValidity(user, authorizable);
	return true;
};
