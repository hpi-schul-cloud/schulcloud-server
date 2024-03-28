import { ObjectId } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { AccountEntity } from '@modules/account/entity/account.entity';

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
