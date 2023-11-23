import { ObjectId } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { Account, User } from '@shared/domain';
import { EntityId } from '@shared/domain/types';

export const mapUserToCurrentUser = (
	user: User,
	account?: Account,
	systemId?: EntityId,
	impersonated?: boolean
): ICurrentUser => {
	const currentUser: ICurrentUser = {
		userId: user.id,
		roles: user.roles.getItems().map((r) => r.id),
		schoolId: user.school.id,
		accountId: account ? account.id : new ObjectId().toHexString(),
		systemId,
		impersonated,
		isExternalUser: false,
	};

	return currentUser;
};
