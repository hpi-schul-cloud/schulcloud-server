import { ObjectId } from '@mikro-orm/mongodb';

import { Account, ICurrentUser, User } from '@shared/domain';

export const mapUserToCurrentUser = (user: User, account?: Account): ICurrentUser => {
	const currentUser: Partial<ICurrentUser> = {
		userId: user.id,
		roles: user.roles.getItems().map((r) => r.id),
		schoolId: user.school.id,
		accountId: account ? account.id : new ObjectId().toHexString(),
	};
	return currentUser as ICurrentUser; // TODO is partial!
};
