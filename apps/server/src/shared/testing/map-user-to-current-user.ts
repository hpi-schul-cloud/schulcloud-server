import { ObjectId } from '@mikro-orm/mongodb';

import { Account, User } from '@shared/domain';
import { ICurrentUser } from '@src/modules/authentication';

export const mapUserToCurrentUser = (user: User, account?: Account): ICurrentUser => {
	const currentUser: Partial<ICurrentUser> = {
		userId: user.id,
		roles: user.roles.getItems().map((r) => r.id),
		schoolId: user.school.id,
		accountId: account ? account.id : new ObjectId().toHexString(),
	};
	return currentUser as ICurrentUser; // TODO is partial!
};
