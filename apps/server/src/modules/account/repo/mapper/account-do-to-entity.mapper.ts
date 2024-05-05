import { ObjectId } from '@mikro-orm/mongodb';
import { Account } from '../../domain';
import { AccountEntity } from '../../entity/account.entity';

export class AccountDoToEntityMapper {
	public static mapToEntity(account: Account): AccountEntity {
		const accountEntity = new AccountEntity({
			userId: account.userId ? new ObjectId(account.userId) : undefined,
			username: account.username,
			activated: account.activated,
			credentialHash: account.credentialHash,
			expiresAt: account.expiresAt,
			lasttriedFailedLogin: account.lasttriedFailedLogin,
			password: account.password,
			systemId: account.systemId ? new ObjectId(account.systemId) : undefined,
			token: account.token,
			deactivatedAt: account.deactivatedAt,
		});

		if (account.id) {
			accountEntity._id = new ObjectId(account.id);
			accountEntity.id = accountEntity._id.toHexString();
		}
		if (account.createdAt) {
			accountEntity.createdAt = account.createdAt;
		}
		if (account.updatedAt) {
			accountEntity.updatedAt = account.updatedAt;
		}
		return accountEntity;
	}
}
