import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export enum BoardRoles {
	EDITOR = 'editor',
	READER = 'reader',
}

export enum UserRoleEnum {
	TEACHER = 'teacher',
	STUDENT = 'student',
	SUBSTITUTION_TEACHER = 'subsitution teacher',
}

export interface UserBoardRoles {
	roles: BoardRoles[];
	userId: EntityId;
	userRoleEnum: UserRoleEnum;
}

export interface BoardDoAuthorizableProps extends AuthorizableObject {
	id: EntityId;
	users: UserBoardRoles[];
	requiredUserRole?: UserRoleEnum;
}

export class BoardDoAuthorizable extends DomainObject<BoardDoAuthorizableProps> {
	get users(): UserBoardRoles[] {
		return this.props.users;
	}

	get requiredUserRole(): UserRoleEnum | undefined {
		return this.props.requiredUserRole;
	}

	set requiredUserRole(userRoleEnum: UserRoleEnum | undefined) {
		this.props.requiredUserRole = userRoleEnum;
	}
}
