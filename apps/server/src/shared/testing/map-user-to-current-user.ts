import { ObjectId } from '@mikro-orm/mongodb';
import { Account } from '@shared/domain/entity/account.entity';
import { User } from '@shared/domain/entity/user.entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { ICurrentUser } from '@src/modules/authentication/interface/user';

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
	};

	return currentUser;
};
