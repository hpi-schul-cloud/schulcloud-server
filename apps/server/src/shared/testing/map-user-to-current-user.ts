import { ObjectId } from '@mikro-orm/mongodb';
import { AccountEntity, EntityId, User } from '@shared/domain';
import { ICurrentUser } from '@modules/authentication';

export const mapUserToCurrentUser = (
	user: User,
	account?: AccountEntity,
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
