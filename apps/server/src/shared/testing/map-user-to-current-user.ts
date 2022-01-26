import { ObjectId } from '@mikro-orm/mongodb';

import { ICurrentUser, User } from '@shared/domain';

export const mapUserToCurrentUser = (user: User): ICurrentUser =>
	({
		userId: user.id,
		roles: user.roles.getItems().map((r) => r.id),
		schoolId: user.school.id,
		accountId: new ObjectId().toHexString(),
	} as ICurrentUser);
