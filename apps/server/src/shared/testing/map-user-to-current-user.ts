import { ObjectId } from '@mikro-orm/mongodb';

import { ICurrentUser, User } from '@shared/domain';

export const mapUserToCurrentUser = (user: User): ICurrentUser => {
	const currentUser: Partial<ICurrentUser> = {
		userId: user.id,
		roles: user.roles.getItems().map((r) => r.id),
		schoolId: user.school.id,
		accountId: new ObjectId().toHexString(),
	};
	return currentUser as ICurrentUser; // TODO is partial!
};
