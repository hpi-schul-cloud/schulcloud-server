import { ObjectId } from '@mikro-orm/mongodb';

import { Account, EntityId, User } from '@shared/domain';
import { ICurrentUser } from '@src/modules/authentication';

export const mapUserToCurrentUser = (user: User, account?: Account, systemId?: EntityId): ICurrentUser => {
	const currentUser: Partial<ICurrentUser> = {
		userId: user.id,
		roles: user.roles.getItems().map((r) => r.id),
		schoolId: user.school.id,
		accountId: account ? account.id : new ObjectId().toHexString(),
		systemId,
	};
	return currentUser as ICurrentUser; // TODO is partial!
};
