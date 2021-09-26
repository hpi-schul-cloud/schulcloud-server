import { ObjectId } from '@mikro-orm/mongodb';
import { ICurrentUser, User, Role } from '@shared/domain';
import { schoolFactory } from '@shared/domain/factory/school.factory';
import { ResolvedUserMapper } from '../mapper';

export const createCurrentTestUser = (
	initPermissions?: string[]
): {
	currentUser: ICurrentUser;
	user: User;
	roles: Role[];
} => {
	const accountId = new ObjectId().toHexString();
	const school = schoolFactory.build();
	school._id = new ObjectId();
	school.id = school._id.toHexString();
	const userIdObject = new ObjectId();
	const userId = userIdObject.toHexString();

	const permissions = initPermissions || ['A', 'B'];
	const roles = [new Role({ name: 'name', permissions })] as Role[];
	const roleIds = roles.map((role) => role.id);

	const user = new User({ email: `Date.now()@email.de`, roles, school });
	user._id = userIdObject;
	user.id = userId;
	const resolvedUser = ResolvedUserMapper.mapToResponse(user, permissions, roles);

	const currentUser = { userId, roles: roleIds, schoolId: school.id, accountId, user: resolvedUser } as ICurrentUser;
	return { currentUser, user, roles };
};
