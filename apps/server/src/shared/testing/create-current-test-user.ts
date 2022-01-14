import { ObjectId } from '@mikro-orm/mongodb';
import { ICurrentUser, User, Role } from '@shared/domain';
// import { ResolvedUserMapper } from '@src/modules/user/mapper';
import { schoolFactory, userFactory } from './factory';

export const createCurrentTestUser = (
	initPermissions?: string[],
	passedUser?: User
): {
	currentUser: ICurrentUser;
	user: User;
	roles: Role[];
} => {
	const accountId = new ObjectId().toHexString();
	const school = schoolFactory.build();
	school._id = new ObjectId();

	const permissions = initPermissions || ['A', 'B'];
	const roles = [new Role({ name: 'name', permissions })] as Role[];
	const roleIds = roles.map((role) => role.id);

	const user = passedUser || userFactory.build({ roles, school });
	// const user = new User({ email: `Date.now()@email.de`, roles, school });
	user._id = new ObjectId();
	// const resolvedUser = ResolvedUserMapper.mapToResponse(user, permissions, roles);

	const currentUser = {
		userId: user.id,
		roles: roleIds,
		schoolId: school.id,
		accountId,
		// user: resolvedUser,
	} as ICurrentUser;
	return { currentUser, user, roles };
};
