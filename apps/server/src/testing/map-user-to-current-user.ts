import { ICurrentUser } from '@infra/auth-guard';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountEntity } from '@modules/account/domain/entity/account.entity';
// Remove the eslint-disable after fixing the import issue in EPIC-96
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { User } from '@modules/user/repo';
import { EntityId } from '@shared/domain/types';

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
		support: impersonated || false,
		isExternalUser: false,
	};

	return currentUser;
};
