import { ObjectId } from '@mikro-orm/mongodb';
import { CurrentUserInterface } from '@modules/authentication';
import { Account, EntityId, User } from '@shared/domain';

export const mapUserToCurrentUser = (
	user: User,
	account?: Account,
	systemId?: EntityId,
	impersonated?: boolean
): CurrentUserInterface => {
	const currentUser: CurrentUserInterface = {
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
