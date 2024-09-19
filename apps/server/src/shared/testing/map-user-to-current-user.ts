import { ICurrentUser } from '@infra/auth-guard';
import { ObjectId } from '@mikro-orm/mongodb';
import { User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { AccountEntity } from '@src/modules/account/domain/entity/account.entity';

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
		impersonated: impersonated || false,
		isExternalUser: false,
	};

	return currentUser;
};
