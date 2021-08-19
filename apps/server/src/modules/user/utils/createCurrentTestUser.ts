import { ObjectId } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@shared/domain';
import { ResolvedUserMapper } from '../mapper';
import { User, Role } from '../entity';

export const createCurrentTestUser = (
	initPermissions?: string[]
): {
	currentUser: ICurrentUser;
	user: User;
	roles: Role[];
} => {
	const accountId = new ObjectId().toHexString();
	const schoolId = new ObjectId().toHexString();

	const permissions = initPermissions || ['A', 'B'];
	const roles = [new Role({ name: 'name', permissions })] as Role[];
	const roleIds = roles.map((role) => role.id);

	const user = new User({ email: `Date.now()@email.de`, roles, school: schoolId });
	const resolvedUser = ResolvedUserMapper.mapToResponse(user, permissions, roles);

	const currentUser = { userId: user.id, roles: roleIds, schoolId, accountId, user: resolvedUser } as ICurrentUser;
	return { currentUser, user, roles };
};
